import { beginBroadcastRun } from "@/lib/frontend/broadcastProgress";
import { findHiveTransaction } from "@/lib/frontend/hive-browser-api";
import { lookupTxOutcome } from "@/lib/frontend/settledTxOutcomes";
import { getChainStatusAction } from "@/lib/backend/actions/land-manager/chain-status-actions";
import {
  describeSequenceResult,
  runSequencedBroadcast,
  splLagOf,
} from "@/lib/shared/hive/sequencedBroadcast";
import { splConfirmSeconds } from "@/lib/shared/hive/splCatchUp";
import { applyDevPrefixToOps } from "@/lib/shared/operations/devPrefix";
import {
  MAX_OPS_PER_BROADCAST,
  TRX_VERIFY_POLL_MS,
  TRX_VERIFY_TIMEOUT_MS,
} from "@/types/landManager";
import type { SplTrxResult } from "@/types/spl/trx";
import { KeychainKeyTypes, KeychainSDK } from "keychain-sdk";
import pLimit from "p-limit";
export { KeychainKeyTypes } from "keychain-sdk";

// Max concurrent SPL lookup calls per poll cycle — prevents rate-limiting
// when waiting on a large number of transactions (e.g. 100+ for big regions).
const VERIFY_CONCURRENCY = 5;

export interface BroadcastResult {
  success: boolean;
  /** Hive transaction ids — one per broadcast batch, for explorer links/logs. */
  txIds: string[];
  /**
   * SPL transaction id of every broadcast op, in op order. Verify and read
   * results with these: a Hive tx id only resolves the batch's first op.
   */
  opTxIds: string[];
  /** Ops SPL confirmed as successful, in op order. */
  confirmedOpTxIds?: string[];
  /** Ops SPL rejected, in op order. Later batches still ran. */
  failedOpTxIds?: string[];
  /**
   * Broadcast ops whose outcome is unknown — they may still land. Never send
   * them again before their outcome is known.
   */
  unconfirmedOpTxIds?: string[];
  error?: string;
}

/**
 * Poll until all txIds resolve (success or failure) or the timeout expires:
 * 30 s plus the time SPL needs to reach the head (`splConfirmSeconds`), read
 * once from the chain status when the first lookup leaves ids pending. Ops a
 * Keychain run already confirmed resolve on that first lookup, so this
 * mainly paces on-behalf (server-broadcast) ops while SPL is behind.
 * - Stops immediately if any tx comes back as `failed` and throws with the error message.
 * - Returns the parsed result for each txId (in the same order), or null if not resolved before timeout.
 * - Throws with a user-visible message on timeout.
 *
 * Looks up straight from the browser, so the polling counts against the
 * visitor's IP, and records settled ids tab-wide (`settledTxOutcomes`) so the
 * Today panel never looks them up again. A single tx is just `[txId]`.
 * Pass SPL op ids (`BroadcastResult.opTxIds`), not Hive tx ids, whenever a
 * batch may hold more than one op — see `splOpTxIds`.
 */
export async function waitForTransactions(
  txIds: string[]
): Promise<(SplTrxResult | null)[]> {
  const results: (SplTrxResult | null)[] = txIds.map(() => null);
  const pending = new Set(txIds.map((_, i) => i));
  const start = Date.now();
  let timeoutMs = TRX_VERIFY_TIMEOUT_MS;
  const limit = pLimit(VERIFY_CONCURRENCY);

  for (
    let pass = 0;
    pending.size > 0 && Date.now() < start + timeoutMs;
    pass++
  ) {
    // Look before the first wait: ops confirmed by broadcastOperations are
    // already recorded (settledTxOutcomes), so they resolve instantly.
    if (pass === 1) timeoutMs += await splCatchUpMs();
    if (pass > 0) await new Promise((r) => setTimeout(r, TRX_VERIFY_POLL_MS));
    await Promise.all(
      [...pending].map((i) =>
        limit(async () => {
          const outcome = await lookupTxOutcome(txIds[i]);
          if (outcome.status === "failed") {
            throw new Error(outcome.error);
          }
          if (outcome.status === "success") {
            results[i] = outcome.result;
            pending.delete(i);
          }
        })
      )
    );
  }

  if (pending.size > 0) {
    throw new Error(
      `Transactions not confirmed within ${Math.round(timeoutMs / 1000)}s — check your wallet.`
    );
  }

  return results;
}

/** Time SPL needs to reach the head now; 0 when the status can't be read. */
async function splCatchUpMs(): Promise<number> {
  try {
    const { blocksBehind } = splLagOf(await getChainStatusAction());
    return splConfirmSeconds(blocksBehind) * 1000;
  } catch {
    return 0;
  }
}

function getKeychain(): KeychainSDK {
  interface HiveKeychainWindow extends Window {
    hive_keychain?: unknown;
  }
  const win = window as HiveKeychainWindow;
  if (!win.hive_keychain) throw new Error("Hive Keychain extension not found");
  return new KeychainSDK(win as Window);
}

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size)
    chunks.push(arr.slice(i, i + size));
  return chunks;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Broadcast operations in one or more Keychain popups, one batch of
 * MAX_OPS_PER_BROADCAST at a time (see `runSequencedBroadcast`): each batch
 * is sent once the previous one is in a Hive block, then Splinterlands'
 * verdict on all ops is awaited once (no fixed timeout; it follows SPL's lag).
 *
 * Never throws for a rejected batch: the result lists which ops went through
 * (`confirmedOpTxIds`), failed (`failedOpTxIds`) or may still land
 * (`unconfirmedOpTxIds`). Progress is published to `broadcastProgress` for
 * the dialogs.
 *
 * `keyType` selects which Hive key Keychain prompts for. Defaults to posting
 * for sm_land_operation flows; pass active for sm_token_transfer (SPS deposit).
 */
export async function broadcastOperations(
  username: string,
  operations: [string, object][],
  keyType: KeychainKeyTypes = KeychainKeyTypes.posting
): Promise<BroadcastResult> {
  const keychain = getKeychain();
  const batches = chunk(applyDevPrefixToOps(operations), MAX_OPS_PER_BROADCAST);
  const run = beginBroadcastRun(username, batches.length);

  try {
    const res = await runSequencedBroadcast(
      batches,
      {
        broadcast: async (ops) => {
          // keychain-sdk rejects (not resolves) with the response on error.
          const result = await keychain.broadcast({
            username,
            operations: ops as Parameters<
              typeof keychain.broadcast
            >[0]["operations"],
            method: keyType,
          });
          if (!result?.success) throw result ?? "Keychain rejected";
          const txId =
            (result.result as unknown as { id?: string })?.id ??
            (result.result as unknown as { tx_id?: string })?.tx_id;
          if (!txId) {
            throw new Error(
              "Keychain did not return a transaction id — the network may still have accepted it"
            );
          }
          return txId;
        },
        findTransaction: findHiveTransaction,
        splLookup: lookupTxOutcome,
        chainStatus: getChainStatusAction,
        sleep,
        now: Date.now,
      },
      { onProgress: run.update }
    );

    return {
      success: res.outcome === "completed",
      txIds: res.txIds,
      opTxIds: res.opTxIds,
      confirmedOpTxIds: res.confirmedOpTxIds,
      failedOpTxIds: res.failedOps.map((f) => f.opTxId),
      unconfirmedOpTxIds: res.unconfirmedOpTxIds,
      error: describeSequenceResult(res),
    };
  } finally {
    run.end();
  }
}
