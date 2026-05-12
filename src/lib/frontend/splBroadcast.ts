import type { TrxLookupOutcome } from "@/types/spl/trx";
import { KeychainKeyTypes, KeychainSDK } from "keychain-sdk";
export {
  buildBuyWithDecOp,
  buildFeeTransferOp,
  buildHarvestOp,
  buildSwapTokensOp,
  generateNonce,
} from "./opBuilders";

export const MAX_OPS_PER_BROADCAST = 100;
const VERIFY_POLL_MS = 3000;
const VERIFY_TIMEOUT_MS = 30_000;

export interface BroadcastResult {
  success: boolean;
  txIds: string[];
  error?: string;
}

/**
 * Poll until all txIds resolve (success or failure) or the 30s timeout expires.
 * - Stops immediately if any tx comes back as `failed` and throws with the error message.
 * - Returns the successful result data indexed by txId position (null = not resolved).
 * - Throws with a user-visible message on timeout.
 */
export async function waitForTransactions(
  txIds: string[],
  lookup: (txId: string) => Promise<TrxLookupOutcome>
): Promise<void> {
  const pending = new Set(txIds.map((_, i) => i));
  const deadline = Date.now() + VERIFY_TIMEOUT_MS;

  while (pending.size > 0 && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, VERIFY_POLL_MS));
    await Promise.all(
      [...pending].map(async (i) => {
        const outcome = await lookup(txIds[i]);
        if (outcome.status === "failed") {
          throw new Error(outcome.error);
        }
        if (outcome.status === "success") {
          pending.delete(i);
        }
      })
    );
  }

  if (pending.size > 0) {
    throw new Error(
      "Transactions not confirmed within 30s — check your wallet."
    );
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

/**
 * Broadcast operations in one or more Keychain popups.
 * Operations are split into chunks of MAX_OPS_PER_BROADCAST.
 * Stops and returns failure on the first rejected chunk.
 */
export async function broadcastOperations(
  username: string,
  operations: [string, object][]
): Promise<BroadcastResult> {
  const keychain = getKeychain();
  const txIds: string[] = [];

  for (const batch of chunk(operations, MAX_OPS_PER_BROADCAST)) {
    const result = await keychain.broadcast({
      username,
      operations: batch as Parameters<
        typeof keychain.broadcast
      >[0]["operations"],
      method: KeychainKeyTypes.posting,
    });

    if (!result?.success) {
      return {
        success: false,
        txIds,
        error:
          (result as unknown as { message?: string })?.message ??
          "Keychain rejected",
      };
    }

    const txId =
      (result.result as unknown as { id?: string })?.id ??
      (result.result as unknown as { tx_id?: string })?.tx_id;
    if (txId) txIds.push(txId);
  }

  return { success: true, txIds };
}
