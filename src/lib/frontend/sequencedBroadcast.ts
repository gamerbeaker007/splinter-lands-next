import { getChainStatusAction } from "@/lib/backend/actions/land-manager/chain-status-actions";
import { findHiveTransaction } from "@/lib/frontend/hive-browser-api";
import { lookupTxOutcome } from "@/lib/frontend/settledTxOutcomes";
import { describeBroadcastError } from "@/lib/shared/hive/broadcastErrors";
import {
  HIVE_BLOCK_SECONDS,
  splConfirmSeconds,
  splLagOf,
} from "@/lib/shared/hive/splCatchUp";
import {
  type Inclusion,
  waitForInclusion,
} from "@/lib/shared/hive/waitForInclusion";
import { splOpTxIds } from "@/lib/shared/splTrxIds";

/**
 * Broadcasts batches one at a time, each only after the previous one is in a
 * Hive block, then waits once for Splinterlands' verdict on all of them.
 * Reads Hive (`findHiveTransaction`) and SPL (`lookupTxOutcome`, the chain
 * status) itself; the caller supplies the Keychain call (splBroadcast.ts).
 *
 * Why inclusion and not a fixed delay: hived allows 5 custom ops per account
 * per block, counted over the node's *pending* pool
 * (database::_push_transaction), so the next batch may only go once the
 * previous one left it. SPL processes blocks in order, so batch k+1 (a later
 * block) always runs after batch k — without waiting for SPL in between,
 * which would cost SPL's lag once per batch. Like before this sequencer, a
 * batch SPL rejects doesn't stop later ones; the result lists every op.
 *
 * No total timeout on the SPL wait: while SPL keeps working through blocks
 * we keep waiting, however far behind it is. We stop only when SPL stops
 * moving, or when it has passed the point where our txs must have expired —
 * and then report those ops as *unconfirmed*, never as failed, and never by
 * re-sending them.
 */

/** Keychain signs with a 10 min expiration; past that a tx can't land anymore. */
const TX_EXPIRY_BLOCKS = (10 * 60) / HIVE_BLOCK_SECONDS;
/** Give up on a batch that isn't in a block after this long (it may still land). */
const INCLUSION_TIMEOUT_MS = 2 * 60_000;
/** Bounds for the SPL lookup interval; it stretches with SPL's lag. */
const POLL_MIN_MS = 3_000;
const POLL_MAX_MS = 15_000;
/** Stop when SPL's processed block hasn't advanced for this long. */
const STALL_MS = 3 * 60_000;

/** Time source; tests pass a fake one to run minutes of SPL lag instantly. */
export interface SequencerClock {
  sleep: (ms: number) => Promise<void>;
  now: () => number;
}

const realClock: SequencerClock = {
  sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
  now: Date.now,
};

export interface SequencerProgress {
  /** 1-based. */
  batch: number;
  totalBatches: number;
  /**
   * Signing in Keychain, signing again after the per-block limit, waiting for
   * the batch to be in a block, or (all batches sent) waiting for SPL.
   */
  phase: "signing" | "retrying" | "including" | "confirming";
  /** Blocks SPL still has to process before it reaches the head. */
  splBlocksBehind?: number;
  /** While confirming: SPL ops settled so far, of `totalOps`. */
  settledOps?: number;
  totalOps?: number;
}

export type SequenceOutcome =
  | "completed"
  /** A batch was rejected (by the node or by SPL). */
  | "failed"
  /** The player cancelled in Keychain. Later batches were not sent. */
  | "cancelled"
  /**
   * An op's outcome is unknown (it may still land). It must not be sent again
   * until its outcome is known.
   */
  | "unconfirmed";

export interface SequenceResult {
  outcome: SequenceOutcome;
  /** Hive tx id of every batch that was broadcast, in order. */
  txIds: string[];
  /** SPL op id of every broadcast op, in op order. */
  opTxIds: string[];
  /** Ops SPL reported as successful, in op order. */
  confirmedOpTxIds: string[];
  /** Ops SPL rejected, in op order, with SPL's error. */
  failedOps: { opTxId: string; error: string }[];
  /** Broadcast SPL ops whose outcome is not known. */
  unconfirmedOpTxIds: string[];
  /** Batches sent (and in a block). */
  sentBatches: number;
  totalBatches: number;
  /** Set unless completed. */
  error?: string;
}

/**
 * Whether SPL processes this op. Every custom_json this app sends is an SPL
 * op (`sm_*`). A HIVE/HBD `transfer` only exists on the chain: it isn't
 * subject to the custom op limit, SPL never reports it, and its owner verifies
 * it (the donation, server-side) — so it is in none of the result lists.
 */
function isSplOp(op: unknown): boolean {
  return Array.isArray(op) && op[0] === "custom_json";
}

/**
 * `broadcast` signs and broadcasts one batch: resolves to its Hive tx id,
 * throws when rejected.
 */
export async function runSequencedBroadcast(
  batches: unknown[][],
  broadcast: (ops: unknown[]) => Promise<string>,
  onProgress?: (progress: SequencerProgress) => void,
  clock: SequencerClock = realClock
): Promise<SequenceResult> {
  const totalBatches = batches.length;
  const result: SequenceResult = {
    outcome: "completed",
    txIds: [],
    opTxIds: [],
    confirmedOpTxIds: [],
    failedOps: [],
    unconfirmedOpTxIds: [],
    sentBatches: 0,
    totalBatches,
  };
  /** Why sending stopped early, if it did. */
  let stopped:
    | { outcome: Exclude<SequenceOutcome, "completed">; error: string }
    | undefined;
  const splOps: string[] = [];

  // ── 1. per batch: sign + broadcast, then wait until it's in a block ───────
  for (let b = 0; b < totalBatches && !stopped; b++) {
    const ops = batches[b];
    const progress = (phase: SequencerProgress["phase"]) =>
      onProgress?.({ batch: b + 1, totalBatches, phase });

    let txId: string | undefined;
    for (let attempt = 0; txId === undefined && !stopped; attempt++) {
      progress(attempt === 0 ? "signing" : "retrying");
      try {
        txId = await broadcast(ops);
      } catch (err) {
        const info = describeBroadcastError(err);
        if (info.kind === "custom_op_limit" && attempt === 0) {
          // Rejected before entering any pending pool: provably not executed.
          // Something else of this account is still pending; give it a block.
          await clock.sleep(HIVE_BLOCK_SECONDS * 1000 + 500);
          continue;
        }
        // A node assertion is a definite rejection. Anything else (network
        // error mid-broadcast) may still have reached the chain — but without
        // a tx id there is nothing to look up.
        stopped = {
          outcome:
            info.kind === "user_cancel"
              ? "cancelled"
              : info.definite
                ? "failed"
                : "unconfirmed",
          error: info.message,
        };
      }
    }
    if (txId === undefined) break;

    const batchOpIds = splOpTxIds(txId, ops.length);
    const batchSplOps = batchOpIds.filter((_, i) => isSplOp(ops[i]));

    // The last batch needs no inclusion wait: nothing is sent after it, and
    // SPL's verdict covers it.
    let inclusion: Inclusion = "included";
    if (b < totalBatches - 1) {
      progress("including");
      inclusion = await waitForInclusion(
        txId,
        { findTransaction: findHiveTransaction, ...clock },
        INCLUSION_TIMEOUT_MS
      );
    }

    if (inclusion === "expired") {
      // Accepted by the node but never in a block: it did not execute.
      stopped = {
        outcome: "failed",
        error: "The transaction expired before it was included in a block.",
      };
      break;
    }
    result.txIds.push(txId);
    result.opTxIds.push(...batchOpIds);
    splOps.push(...batchSplOps);
    if (inclusion === "unknown") {
      stopped = {
        outcome: "unconfirmed",
        error: "Hive did not confirm that this batch is in a block.",
      };
      break;
    }
    result.sentBatches++;
  }

  // ── 2. wait once for SPL's verdict on every SPL op that was sent ──────────
  const verdict = await waitForSpl(splOps, clock, (p) =>
    onProgress?.({
      batch: result.sentBatches,
      totalBatches,
      phase: "confirming",
      ...p,
    })
  );
  const unconfirmed = new Set(verdict.unconfirmed);
  for (const id of splOps) {
    const error = verdict.errors.get(id);
    if (error !== undefined) result.failedOps.push({ opTxId: id, error });
    else if (unconfirmed.has(id)) result.unconfirmedOpTxIds.push(id);
    else result.confirmedOpTxIds.push(id);
  }

  if (stopped) {
    return Object.assign(result, stopped);
  }
  if (result.failedOps.length > 0) {
    return Object.assign(result, {
      outcome: "failed" as const,
      error: result.failedOps[0].error,
    });
  }
  if (result.unconfirmedOpTxIds.length > 0) {
    return Object.assign(result, {
      outcome: "unconfirmed" as const,
      error: verdict.reason,
    });
  }
  return result;
}

/**
 * Polls SPL until every op has settled, SPL stops advancing, or SPL is past
 * the point where the txs must have expired. SPL processes blocks in order,
 * so each poll looks up ops in op order and stops at the first one still
 * pending — about one lookup per poll while SPL catches up.
 */
async function waitForSpl(
  opIds: string[],
  clock: SequencerClock,
  progress: (p: Partial<SequencerProgress>) => void
): Promise<{
  errors: Map<string, string>;
  unconfirmed: string[];
  reason?: string;
}> {
  const errors = new Map<string, string>();
  const pending = [...opIds];
  // An unreadable status counts as "SPL didn't move"; the stall limit bounds it.
  const chainStatus = () => getChainStatusAction().catch(() => undefined);

  /** Looks up pending ops in order; `untilPending` stops at the first unsettled one. */
  const sweep = async (untilPending: boolean) => {
    for (let i = 0; i < pending.length;) {
      const outcome = await lookupTxOutcome(pending[i]);
      if (outcome.status === "pending") {
        if (untilPending) return;
        i++;
        continue;
      }
      if (outcome.status === "failed") errors.set(pending[i], outcome.error);
      pending.splice(i, 1);
    }
  };

  // Set from the first status that can be read: a later head only makes the
  // bound later (safe), while no bound at all would let SPL advance forever
  // without a missing tx ever ending the wait.
  let lastPossibleBlock: number | undefined;
  let splLast = -Infinity;
  let lastAdvanceAt = clock.now();

  while (pending.length > 0) {
    await sweep(true);
    if (pending.length === 0) break;

    const status = await chainStatus();
    if (status && lastPossibleBlock === undefined) {
      lastPossibleBlock = status.hiveHeadBlock + TX_EXPIRY_BLOCKS;
    }
    if (status && status.splLastBlock > splLast) {
      splLast = status.splLastBlock;
      lastAdvanceAt = clock.now();
    }
    const behind = status ? splLagOf(status).blocksBehind : undefined;
    progress({
      splBlocksBehind: behind,
      settledOps: opIds.length - pending.length,
      totalOps: opIds.length,
    });

    let reason: string | undefined;
    if (lastPossibleBlock !== undefined && splLast > lastPossibleBlock) {
      reason =
        "Splinterlands has processed past the point where this transaction could still land, but has no record of it.";
    } else if (clock.now() - lastAdvanceAt > STALL_MS) {
      reason =
        "Splinterlands has stopped processing blocks (or could not be reached).";
    }
    if (reason) {
      // Ops behind a missing one may have landed: look at each once more.
      await sweep(false);
      return { errors, unconfirmed: pending, reason };
    }

    // About twice per expected wait, within bounds.
    const etaMs = splConfirmSeconds(behind ?? 0) * 1000;
    await clock.sleep(Math.min(POLL_MAX_MS, Math.max(POLL_MIN_MS, etaMs / 2)));
  }
  return { errors, unconfirmed: [] };
}

/**
 * One line for the player: where the run stopped, what went through, and
 * what to do about it.
 */
export function describeSequenceResult(
  res: SequenceResult
): string | undefined {
  if (res.outcome === "completed") return undefined;
  const total = res.opTxIds.length;
  const ok = res.confirmedOpTxIds.length;
  const parts: string[] = [];

  if (res.sentBatches < res.totalBatches) {
    const at = res.sentBatches + 1;
    parts.push(
      res.totalBatches > 1
        ? `Stopped at batch ${at} of ${res.totalBatches}: ${res.error}`
        : `Stopped: ${res.error}`
    );
    if (res.totalBatches > at)
      parts.push("The remaining batches were not sent.");
  }
  if (res.failedOps.length > 0) {
    const n = res.failedOps.length;
    parts.push(
      `${n} of ${total} operation${total === 1 ? "" : "s"} failed: ${res.failedOps[0].error}`
    );
  } else if (res.sentBatches === res.totalBatches && res.error) {
    parts.push(res.error);
  }
  if (ok > 0 && ok < total) {
    parts.push(`${ok} operation${ok === 1 ? "" : "s"} went through.`);
  }
  if (res.outcome === "unconfirmed" || res.unconfirmedOpTxIds.length > 0) {
    parts.push(
      "Some operations may still land — check the result before running them again."
    );
  }
  return parts.join(" ");
}
