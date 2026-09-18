import type { Operation } from "@hiveio/dhive";
import HAS from "hive-auth-wrapper";
import { formatError } from "@/lib/frontend/errorFormat";
import type { Signer, SignerKeyType } from "./Signer";

interface HiveAuthSession {
  username: string;
  token?: string;
  expire?: number;
  key?: string;
}

export interface HiveAuthWait {
  qr: string;
  deepLink: string;
  expire?: number;
}

export type HiveAuthWaitHandler = (wait: HiveAuthWait) => void;

function encodeBase64(value: string): string {
  return btoa(unescape(encodeURIComponent(value)));
}

function isExpired(session: HiveAuthSession): boolean {
  return !session.expire || session.expire <= Date.now();
}

function commandOf(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  const command = (error as { cmd?: unknown }).cmd;
  return typeof command === "string" ? command : undefined;
}

function detailOf(error: unknown): string {
  if (typeof error === "string") return error.trim();
  if (error instanceof Error) return error.message.trim();
  if (!error || typeof error !== "object") return "";

  const value = error as Record<string, unknown>;
  for (const key of ["message", "error", "data"]) {
    const detail = detailOf(value[key]);
    if (detail) return detail;
  }
  return "";
}

function authError(error: unknown): Error {
  const command = commandOf(error);
  const message = formatError(error).trim();

  if (
    command === "auth_nack" ||
    command === "challenge_nack" ||
    command === "sign_nack"
  ) {
    return new Error("Request rejected in the wallet.");
  }
  if (command?.endsWith("_err")) {
    return new Error(detailOf(error) || "HiveAuth request failed.");
  }
  if (/^expired$/i.test(message)) {
    return new Error("Request expired. Try again.");
  }
  if (/HiveAuth session expired/i.test(message)) {
    return new Error("HiveAuth session expired. Connect again.");
  }
  if (/expired/i.test(message)) {
    return new Error("Request expired. Try again.");
  }
  if (
    /transport|not connected|failed to connect|network|websocket/i.test(message)
  ) {
    return new Error("Could not reach the HiveAuth server.");
  }
  if (/nack|reject|declin/i.test(message)) {
    return new Error("Request rejected in the wallet.");
  }
  return new Error(`HiveAuth error: ${message || "Sign-in failed."}`);
}

function shouldClearSession(error: unknown): boolean {
  const command = commandOf(error);
  if (command?.endsWith("_nack") || command?.endsWith("_err")) return true;
  return /expired|transport|not connected|failed to connect|network|websocket|nack|reject|declin/i.test(
    formatError(error)
  );
}

function challengeSignature(response: unknown): string | undefined {
  if (!response || typeof response !== "object") return undefined;
  const data = (response as { data?: unknown }).data;
  if (!data || typeof data !== "object") return undefined;

  const challenge = (data as { challenge?: unknown }).challenge;
  if (typeof challenge === "string" && challenge) return challenge;
  if (!challenge || typeof challenge !== "object") return undefined;

  const signature = (challenge as { challenge?: unknown }).challenge;
  return typeof signature === "string" && signature ? signature : undefined;
}

export function normalizeHiveAuthTxId(response: unknown): string | undefined {
  if (!response || typeof response !== "object") return undefined;
  const data = (response as { data?: unknown }).data;

  if (typeof data === "string") {
    const value = data.trim();
    if (!value) return undefined;
    try {
      return normalizeHiveAuthTxId({ data: JSON.parse(value) });
    } catch {
      return value;
    }
  }

  if (data && typeof data === "object") {
    const value = data as { id?: unknown; tx_id?: unknown };
    if (typeof value.id === "string") return value.id;
    if (typeof value.tx_id === "string") return value.tx_id;
  }

  return undefined;
}

export class HiveAuthSigner implements Signer {
  readonly kind = "hiveauth" as const;
  private session: HiveAuthSession | null = null;
  private expiryTimer: ReturnType<typeof setTimeout> | null = null;

  isAvailable(): boolean {
    return typeof window !== "undefined" && typeof WebSocket !== "undefined";
  }

  async connect(username: string, onWait: HiveAuthWaitHandler): Promise<void> {
    await this.authenticate(username, undefined, onWait);
  }

  async connectAndSign(
    username: string,
    message: string,
    onWait: HiveAuthWaitHandler
  ): Promise<string> {
    const signature = await this.authenticate(
      username,
      { key_type: "posting", challenge: message },
      onWait
    );
    if (!signature) throw new Error("HiveAuth returned an empty signature");
    return signature;
  }

  private async authenticate(
    username: string,
    challenge: { key_type: "posting"; challenge: string } | undefined,
    onWait: HiveAuthWaitHandler
  ): Promise<string | undefined> {
    const account = username.toLowerCase();
    this.clear();

    try {
      const connected = await HAS.connect();
      if (!connected) throw new Error("HiveAuth transport is unavailable");

      const auth: HiveAuthSession = { username: account };
      const result = await HAS.authenticate(
        auth,
        {
          name: "Land Manager",
          description: "Manage Splinterlands land with Hive",
          icon:
            typeof window === "undefined"
              ? "/images/Splinterlands.avif"
              : `${window.location.origin}/images/Splinterlands.avif`,
        },
        challenge,
        (event) => {
          const wait = event as {
            account?: string;
            uuid?: string;
            key?: string;
            expire?: number;
          };
          if (!wait.uuid || !wait.key) return;
          const payload = encodeBase64(
            JSON.stringify({
              account: wait.account ?? account,
              uuid: wait.uuid,
              key: wait.key,
              host: HAS.status().host,
            })
          );
          const deepLink = `has://auth_req/${payload}`;
          onWait({ qr: deepLink, deepLink, expire: wait.expire });
        }
      );

      const signature = challenge ? challengeSignature(result) : undefined;
      if (challenge && !signature) {
        throw new Error("HiveAuth returned an empty signature");
      }
      this.session = { ...auth };
      this.scheduleExpiry();
      return signature;
    } catch (error) {
      this.clear();
      throw authError(error);
    }
  }

  clear(): void {
    this.session = null;
    if (this.expiryTimer) clearTimeout(this.expiryTimer);
    this.expiryTimer = null;
  }

  async signBuffer(
    _username: string,
    message: string,
    keyType: SignerKeyType
  ): Promise<string> {
    const session = this.getSession();

    try {
      const result = await HAS.challenge(session, {
        key_type: keyType,
        challenge: message,
      });
      const data = result?.data as { challenge?: unknown } | undefined;
      if (typeof data?.challenge !== "string" || !data.challenge) {
        throw new Error("HiveAuth returned an empty signature");
      }
      return data.challenge;
    } catch (error) {
      if (shouldClearSession(error)) this.clear();
      throw authError(error);
    }
  }

  async broadcast(
    _username: string,
    operations: Operation[],
    keyType: SignerKeyType
  ): Promise<{ txId: string }> {
    const session = this.getSession();

    try {
      const result = await HAS.broadcast(
        session,
        keyType,
        operations as unknown[]
      );
      const txId = normalizeHiveAuthTxId(result);
      if (!txId) throw new Error("HiveAuth returned an empty transaction id");
      return { txId };
    } catch (error) {
      if (shouldClearSession(error)) this.clear();
      throw authError(error);
    }
  }

  private getSession(): HiveAuthSession {
    if (!this.session || isExpired(this.session)) {
      this.clear();
      throw new Error("HiveAuth session expired. Connect again.");
    }
    return this.session;
  }

  private scheduleExpiry(): void {
    if (!this.session?.expire) return;
    const delay = this.session.expire - Date.now();
    if (delay <= 0) {
      this.clear();
      return;
    }
    this.expiryTimer = setTimeout(() => this.clear(), delay);
  }
}
