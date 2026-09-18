import type { Operation } from "@hiveio/dhive";
import { formatError } from "@/lib/frontend/errorFormat";
import { KeychainKeyTypes, KeychainSDK } from "keychain-sdk";
import type { Signer, SignerKeyType } from "./Signer";

interface HiveKeychainWindow extends Window {
  hive_keychain?: unknown;
}

function getKeychain(): KeychainSDK {
  const win = window as HiveKeychainWindow;
  if (!win.hive_keychain) throw new Error("Hive Keychain extension not found");
  return new KeychainSDK(win as Window);
}

function toKeychainKeyType(keyType: SignerKeyType): KeychainKeyTypes {
  return keyType === "active"
    ? KeychainKeyTypes.active
    : KeychainKeyTypes.posting;
}

export function extractKeychainTxId(result: unknown): string | undefined {
  if (!result || typeof result !== "object") return undefined;
  const value = result as { id?: unknown; tx_id?: unknown };
  return typeof value.id === "string"
    ? value.id
    : typeof value.tx_id === "string"
      ? value.tx_id
      : undefined;
}

export class KeychainSigner implements Signer {
  readonly kind = "keychain" as const;

  isAvailable(): boolean {
    return (
      typeof window !== "undefined" &&
      Boolean((window as HiveKeychainWindow).hive_keychain)
    );
  }

  async signBuffer(
    username: string,
    message: string,
    keyType: SignerKeyType
  ): Promise<string> {
    try {
      const keychain = getKeychain();
      const result = await keychain.signBuffer({
        username: username.toLowerCase(),
        message,
        method: toKeychainKeyType(keyType),
      });

      if (result?.success) {
        const signature =
          typeof result.result === "string"
            ? result.result
            : result.message || "";

        if (!signature) {
          throw new Error("Keychain returned empty signature");
        }

        return signature;
      }
      throw new Error("Keychain signature was rejected or failed");
    } catch (err) {
      let errorMessage = "Unknown Keychain error occurred";

      if (err instanceof Error) {
        errorMessage = `Keychain error: ${err.message}`;
      } else if (err && typeof err === "object" && "message" in err) {
        errorMessage = `Keychain error: ${err.message}`;
      }

      throw new Error(errorMessage);
    }
  }

  async broadcast(
    username: string,
    operations: Operation[],
    keyType: SignerKeyType
  ): Promise<{ txId: string }> {
    const keychain = getKeychain();
    const result = await keychain.broadcast({
      username,
      operations: operations as Parameters<
        typeof keychain.broadcast
      >[0]["operations"],
      method: toKeychainKeyType(keyType),
    });

    if (!result?.success) {
      throw new Error(formatError(result ?? "Keychain rejected"));
    }

    return { txId: extractKeychainTxId(result.result) ?? "" };
  }
}
