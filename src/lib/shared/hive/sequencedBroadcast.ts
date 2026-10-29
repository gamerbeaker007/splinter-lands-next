import { describeBroadcastError } from "@/lib/shared/hive/broadcastErrors";
import { splOpTxIds } from "@/lib/shared/splTrxIds";
import type { TrxLookupOutcome } from "@/types/spl/trx";

/**
 * Broadcasts batches one at a time, each only after Splinterlands confirmed
 * the previous one. Pure: the browser binds it to Keychain (splBroadcast.ts).
 *
 * Why not a fixed delay (or "wait for the next block"): hived allows 5 custom
 * ops per account per block, counted over the node's *pending* pool
 * (database::_push_transaction). A new head block doesn't prove our batch is
 * in it; SPL's verdict does (SPL only processes blocks). Waiting for it also
 * means batch k+1 never runs on top of a step that failed.
 *
 * No total timeout: while SPL keeps working through blocks we keep waiting,
 * however far behind it is. We stop only when SPL stops moving, or when it has
 * passed the point where our tx must have expired — and then report the batch
 * as *unconfirmed*, never as failed, and never by re-sending it.
 */

/** Hive's block interval. */
export const HIVE_BLOCK_SECONDS = 3;
/** Keychain signs with a 10 min expiration; past that a tx can't land anymore. */
const TX_EXPIRY_BLOCKS = (10 * 60) / HIVE_BLOCK_SECONDS;

/** Where the chain is and how far SPL has processed it. */
export interface ChainStatus {
  hiveHeadBlock: number;
  splLastBlock: number;
}

/** How far SPL trails the Hive head. */
export function splLagOf(status: ChainStatus) {
  const blocksBehind = Math.max(0, status.hiveHeadBlock - status.splLastBlock);
  return { blocksBehind, seconds: blocksBehind * HIVE_BLOCK_SECONDS };
}

export type SplProcessingLag = ReturnType<typeof splLagOf>;

export interface SequencerDeps {
  /** Signs and broadcasts one batch. Resolves to its Hive tx id; throws when rejected. */
  broadcast: (ops: unknown[]) => Promise<string>;
  splLookup: (opTxId: string) => Promise<TrxLookupOutcome>;
  chainStatus: () => Promise<ChainStatus>;
  sleep: (ms: number) => Promise<void>;
  now: () => number;
}

export interface SequencerTiming {
  /** Bounds for the SPL lookup interval; it stretches with SPL's lag. */
  pollMinMs: number;
  pollMaxMs: number;
  /** Stop when SPL's processed block hasn't advanced for this long. */
  stallMs: number;
}

export const DEFAULT_SEQUENCER_TIMING: SequencerTiming = {
  pollMinMs: 3_000,
  pollMaxMs: 15_000,
  stallMs: 3 * 60_000,
};

export interface SequencerProgress {
  /** 1-based. */
  batch: number;
  totalBatches: number;
  /** Signing in Keychain, signing again after the per-block limit, or waiting for SPL. */
  phase: "signing" | "retrying" | "confirming";
  /** Blocks SPL still has to process before it reaches the head. */
  splBlocksBehind?: number;
}

export type SequenceOutcome =
  | "completed"
  /** A batch was rejected (by the node or by SPL). Later batches were not sent. */
  | "failed"
  /** The player cancelled in Keychain. Later batches were not sent. */
  | "cancelled"
  /**
   * A batch's outcome is unknown (it may still land). Later batches were not
   * sent, and the batch must not be sent again until its outcome is known.
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
  /** Broadcast SPL ops whose outcome is not known. */
  unconfirmedOpTxIds: string[];
  /** Batches fully confirmed. */
  confirmedBatches: number;
  totalBatches: number;
  /** Set unless completed. */
  error?: string;
}

/**
 * Whether SPL processes this op. Every custom_json this app sends is an SPL
 * op (`sm_*`). A HIVE/HBD `transfer` only exists on the chain: it isn't
 * subject to the custom op limit, SPL never reports it, and its owner verifies
 * it (the donation, server-side) — so it is in neither result list.
 */
function isSplOp(op: unknown): boolean {
  return Array.isArray(op) && op[0] === "custom_json";
}

export async function runSequencedBroadcast(
  batches: unknown[][],
  deps: SequencerDeps,
  options: {
    onProgress?: (progress: SequencerProgress) => void;
    timing?: Partial<SequencerTiming>;
  } = {}
): Promise<SequenceResult> {
  const timing = { ...DEFAULT_SEQUENCER_TIMING, ...options.timing };
  const totalBatches = batches.length;
  const result: SequenceResult = {
    outcome: "completed",
    txIds: [],
    opTxIds: [],
    confirmedOpTxIds: [],
    unconfirmedOpTxIds: [],
    confirmedBatches: 0,
    totalBatches,
  };
  const stop = (
    outcome: Exclude<SequenceOutcome, "completed">,
    error: string
  ) => Object.assign(result, { outcome, error });
  // An unreadable status counts as "SPL didn't move"; the stall limit bounds it.
  const chainStatus = () => deps.chainStatus().catch(() => undefined);

  for (let b = 0; b < totalBatches; b++) {
    const ops = batches[b];
    const progress = (p: Omit<SequencerProgress, "batch" | "totalBatches">) =>
      options.onProgress?.({ batch: b + 1, totalBatches, ...p });

    // ── 1. sign + broadcast (one retry on the per-block limit) ──────────────
    let txId: string | undefined;
    for (let attempt = 0; txId === undefined; attempt++) {
      progress({ phase: attempt === 0 ? "signing" : "retrying" });
      try {
        txId = await deps.broadcast(ops);
      } catch (err) {
        const info = describeBroadcastError(err);
        if (info.kind === "custom_op_limit" && attempt === 0) {
          // Rejected before entering any pending pool: provably not executed.
          // Something else of this account is still pending; give it a block.
          await deps.sleep(HIVE_BLOCK_SECONDS * 1000 + 500);
          continue;
        }
        if (info.kind === "user_cancel") return stop("cancelled", info.message);
        // A node assertion is a definite rejection. Anything else (network
        // error mid-broadcast) may still have reached the chain.
        return stop(info.definite ? "failed" : "unconfirmed", info.message);
      }
    }

    const batchOpIds = splOpTxIds(txId, ops.length);
    result.txIds.push(txId);
    result.opTxIds.push(...batchOpIds);
    const splOpIds = batchOpIds.filter((_, i) => isSplOp(ops[i]));
    const pending = new Set(splOpIds);
    const failed = new Set<string>();
    // Ops SPL accepted did run, also those after a failed op in the batch.
    const settleBatch = () => {
      result.confirmedOpTxIds.push(
        ...splOpIds.filter((op) => !pending.has(op) && !failed.has(op))
      );
      result.unconfirmedOpTxIds.push(...pending);
    };

    // ── 2. wait for SPL's verdict on every SPL op of the batch ──────────────
    const lastPossibleBlock =
      ((await chainStatus())?.hiveHeadBlock ?? Infinity) + TX_EXPIRY_BLOCKS;
    let splLast = -Infinity;
    let lastAdvanceAt = deps.now();

    while (pending.size > 0) {
      let failure: string | undefined;
      for (const id of [...pending]) {
        const outcome = await deps.splLookup(id);
        if (outcome.status === "pending") continue;
        pending.delete(id);
        if (outcome.status === "failed") {
          failure ??= outcome.error;
          failed.add(id);
        }
      }
      if (failure !== undefined) {
        settleBatch();
        return stop("failed", failure);
      }
      if (pending.size === 0) break;

      const status = await chainStatus();
      if (status && status.splLastBlock > splLast) {
        splLast = status.splLastBlock;
        lastAdvanceAt = deps.now();
      }
      const behind = status ? splLagOf(status).blocksBehind : undefined;
      progress({ phase: "confirming", splBlocksBehind: behind });

      if (splLast > lastPossibleBlock) {
        settleBatch();
        return stop(
          "unconfirmed",
          "Splinterlands has processed past the point where this transaction could still land, but has no record of it."
        );
      }
      if (deps.now() - lastAdvanceAt > timing.stallMs) {
        settleBatch();
        return stop(
          "unconfirmed",
          "Splinterlands has stopped processing blocks (or could not be reached)."
        );
      }
      // About twice per expected wait, within bounds.
      const etaMs = ((behind ?? 0) + 1) * HIVE_BLOCK_SECONDS * 1000;
      await deps.sleep(
        Math.min(timing.pollMaxMs, Math.max(timing.pollMinMs, etaMs / 2))
      );
    }

    settleBatch();
    result.confirmedBatches++;
  }

  return result;
}

/**
 * One line for the player: where the run stopped, what already went through,
 * and what to do about it.
 */
export function describeSequenceResult(
  res: SequenceResult
): string | undefined {
  if (res.outcome === "completed") return undefined;
  const failedBatch = res.confirmedBatches + 1;
  const where =
    res.totalBatches > 1
      ? `Stopped at batch ${failedBatch} of ${res.totalBatches}`
      : "Stopped";
  const n = res.confirmedOpTxIds.length;
  const done =
    n > 0 ? ` (${n} earlier operation${n === 1 ? "" : "s"} went through)` : "";
  const notSent =
    res.totalBatches > failedBatch
      ? " The remaining batches were not sent."
      : "";
  const unknown =
    res.outcome === "unconfirmed"
      ? " This batch may still land — check the result before running it again."
      : "";
  return `${where}${done}: ${res.error}${notSent}${unknown}`;
}
