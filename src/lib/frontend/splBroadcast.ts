import { lookupTransaction } from "@/lib/backend/actions/land-manager/overview-actions";
import { applyDevPrefixToOps } from "@/lib/shared/operations/devPrefix";
import { getCurrentSigner } from "@/lib/frontend/signing";
import {
  HIVE_BLOCK_MS,
  MAX_OPS_PER_BROADCAST,
  TRX_VERIFY_POLL_MS,
  TRX_VERIFY_TIMEOUT_MS,
} from "@/types/landManager";
import type { SplTrxResult } from "@/types/spl/trx";
import type { Operation } from "@hiveio/dhive";
import { KeychainKeyTypes } from "keychain-sdk";
import pLimit from "p-limit";
import { formatError } from "./errorFormat";
export { KeychainKeyTypes } from "keychain-sdk";

// Max concurrent SPL lookup calls per poll cycle — prevents rate-limiting
// when waiting on a large number of transactions (e.g. 100+ for big regions).
const VERIFY_CONCURRENCY = 5;

export interface BroadcastResult {
  success: boolean;
  txIds: string[];
  error?: string;
  uncertain?: boolean;
}

/**
 * Poll until all txIds resolve (success or failure) or the 30s timeout expires.
 * - Stops immediately if any tx comes back as `failed` and throws with the error message.
 * - Returns the parsed result for each txId (in the same order), or null if not resolved before timeout.
 * - Throws with a user-visible message on timeout.
 *
 * Looks up via the SPL `lookupTransaction` action. A single tx is just `[txId]`.
 */
export async function waitForTransactions(
  txIds: string[]
): Promise<(SplTrxResult | null)[]> {
  const results: (SplTrxResult | null)[] = txIds.map(() => null);
  const pending = new Set(txIds.map((_, i) => i));
  const deadline = Date.now() + TRX_VERIFY_TIMEOUT_MS;
  const limit = pLimit(VERIFY_CONCURRENCY);

  while (pending.size > 0 && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, TRX_VERIFY_POLL_MS));
    await Promise.all(
      [...pending].map((i) =>
        limit(async () => {
          const outcome = await lookupTransaction(txIds[i]);
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
      `Transactions not confirmed within ${TRX_VERIFY_TIMEOUT_MS / 1000}s — check your wallet.`
    );
  }

  return results;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size)
    chunks.push(arr.slice(i, i + size));
  return chunks;
}

/**
 * Broadcast operations in one or more signer requests.
 * Operations are split into chunks of MAX_OPS_PER_BROADCAST.
 * Stops and returns failure on the first rejected chunk.
 *
 * `keyType` selects which Hive key Keychain prompts for. Defaults to posting
 * for sm_land_operation flows; pass active for sm_token_transfer (SPS deposit).
 */
export async function broadcastOperations(
  username: string,
  operations: [string, object][],
  keyType: KeychainKeyTypes = KeychainKeyTypes.posting
): Promise<BroadcastResult> {
  const signer = getCurrentSigner();
  const txIds: string[] = [];
  const batches = chunk(applyDevPrefixToOps(operations), MAX_OPS_PER_BROADCAST);

  for (let i = 0; i < batches.length; i++) {
    try {
      const result = await signer.broadcast(
        username,
        batches[i] as unknown as Operation[],
        keyType === KeychainKeyTypes.active ? "active" : "posting"
      );
      if (result.txId) txIds.push(result.txId);
      if (result.submitted && !result.txId) {
        return {
          success: false,
          txIds,
          error:
            "The wallet reported the transaction as submitted but returned no transaction id. Check your wallet or account history before retrying.",
          uncertain: true,
        };
      }
    } catch (error) {
      return {
        success: false,
        txIds,
        error: formatError(error),
      };
    }

    // Wait a full block before the next batch so all ops land in different blocks
    if (i < batches.length - 1) {
      await new Promise((r) => setTimeout(r, HIVE_BLOCK_MS));
    }
  }

  return { success: true, txIds };
}
