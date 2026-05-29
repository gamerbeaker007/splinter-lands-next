import { HIVE_BLOCK_MS, MAX_OPS_PER_BROADCAST } from "@/types/landManager";
import type { SplTrxResult, TrxLookupOutcome } from "@/types/spl/trx";
import { KeychainKeyTypes, KeychainSDK } from "keychain-sdk";
import pLimit from "p-limit";
import { formatError } from "./errorFormat";
export { KeychainKeyTypes } from "keychain-sdk";

const VERIFY_POLL_MS = 3000;
const VERIFY_TIMEOUT_MS = 30_000;
// Max concurrent SPL lookup calls per poll cycle — prevents rate-limiting
// when waiting on a large number of transactions (e.g. 100+ for big regions).
const VERIFY_CONCURRENCY = 5;

export interface BroadcastResult {
  success: boolean;
  txIds: string[];
  error?: string;
}

/**
 * Poll until all txIds resolve (success or failure) or the 30s timeout expires.
 * - Stops immediately if any tx comes back as `failed` and throws with the error message.
 * - Returns the parsed result for each txId (in the same order), or null if not resolved before timeout.
 * - Throws with a user-visible message on timeout.
 */
export async function waitForTransactions(
  txIds: string[],
  lookup: (txId: string) => Promise<TrxLookupOutcome>
): Promise<(SplTrxResult | null)[]> {
  const results: (SplTrxResult | null)[] = txIds.map(() => null);
  const pending = new Set(txIds.map((_, i) => i));
  const deadline = Date.now() + VERIFY_TIMEOUT_MS;
  const limit = pLimit(VERIFY_CONCURRENCY);

  while (pending.size > 0 && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, VERIFY_POLL_MS));
    await Promise.all(
      [...pending].map((i) =>
        limit(async () => {
          const outcome = await lookup(txIds[i]);
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
      "Transactions not confirmed within 30s — check your wallet."
    );
  }

  return results;
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

/**
 * Broadcast operations in one or more Keychain popups.
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
  const keychain = getKeychain();
  const txIds: string[] = [];
  const batches = chunk(operations, MAX_OPS_PER_BROADCAST);

  for (let i = 0; i < batches.length; i++) {
    const result = await keychain.broadcast({
      username,
      operations: batches[i] as Parameters<
        typeof keychain.broadcast
      >[0]["operations"],
      method: keyType,
    });

    if (!result?.success) {
      // Keychain may return either a string message or an object (e.g.
      // `{ message: "user_cancel" }`); formatError handles both.
      return {
        success: false,
        txIds,
        error: formatError(result ?? "Keychain rejected"),
      };
    }

    const txId =
      (result.result as unknown as { id?: string })?.id ??
      (result.result as unknown as { tx_id?: string })?.tx_id;
    if (txId) txIds.push(txId);

    // Wait a full block before the next batch so all ops land in different blocks
    if (i < batches.length - 1) {
      await new Promise((r) => setTimeout(r, HIVE_BLOCK_MS));
    }
  }

  return { success: true, txIds };
}
