import type { Operation } from "@hiveio/dhive";

export type SignerKeyType = "posting" | "active";
export type SignerKind = "keychain" | "hiveauth";

export interface SignerBroadcastWait {
  expire?: number;
}

export interface SignerBroadcastOptions {
  onWait?: (wait: SignerBroadcastWait) => void;
}

export interface Signer {
  readonly kind: SignerKind;
  isAvailable(): boolean;
  signBuffer(
    username: string,
    message: string,
    keyType: SignerKeyType
  ): Promise<string>;
  broadcast(
    username: string,
    operations: Operation[],
    keyType: SignerKeyType,
    options?: SignerBroadcastOptions
  ): Promise<{ txId?: string; submitted: boolean }>;
}
