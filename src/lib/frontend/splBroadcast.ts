import { KeychainKeyTypes, KeychainSDK } from "keychain-sdk";
export {
  generateNonce,
  buildHarvestOp,
  buildFeeTransferOp,
  buildSwapTokensOp,
  buildBuyWithDecOp,
} from "./opBuilders";

export interface BroadcastResult {
  success: boolean;
  txId?: string;
  error?: string;
}

function getKeychain(): KeychainSDK {
  interface HiveKeychainWindow extends Window {
    hive_keychain?: unknown;
  }
  const win = window as HiveKeychainWindow;
  if (!win.hive_keychain) throw new Error("Hive Keychain extension not found");
  return new KeychainSDK(win as Window);
}

/**
 * Broadcast multiple sm_land_operation custom_json operations in a single
 * Keychain popup (one transaction, multiple ops).
 */
export async function broadcastOperations(
  username: string,
  operations: [string, object][]
): Promise<BroadcastResult> {
  const keychain = getKeychain();

  const result = await keychain.broadcast({
    username,
    operations: operations as Parameters<
      typeof keychain.broadcast
    >[0]["operations"],
    method: KeychainKeyTypes.posting,
  });

  if (!result?.success) {
    return {
      success: false,
      error:
        (result as unknown as { message?: string })?.message ??
        "Keychain rejected",
    };
  }
  return {
    success: true,
    txId:
      (result.result as unknown as { id?: string; tx_id?: string })?.id ??
      (result.result as unknown as { tx_id?: string })?.tx_id,
  };
}
