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

function authError(error: unknown): Error {
  const message = formatError(error);
  if (/expired/i.test(message)) {
    return new Error("HiveAuth session expired. Connect again.");
  }
  if (/nack|reject|declin/i.test(message)) {
    return new Error("HiveAuth request was rejected.");
  }
  return new Error(`HiveAuth error: ${message}`);
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
    const account = username.toLowerCase();
    this.clear();

    try {
      const connected = await HAS.connect();
      if (!connected) throw new Error("HiveAuth transport is unavailable");

      const auth: HiveAuthSession = { username: account };
      await HAS.authenticate(
        auth,
        {
          name: "Land Manager",
          description: "Manage Splinterlands land with Hive",
          icon:
            typeof window === "undefined"
              ? "/images/Splinterlands.avif"
              : `${window.location.origin}/images/Splinterlands.avif`,
        },
        undefined,
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

      this.session = { ...auth };
      this.scheduleExpiry();
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
      if (
        /expired|nack|reject|declin|transport|connect/i.test(formatError(error))
      ) {
        this.clear();
      }
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
      if (
        /expired|nack|reject|declin|transport|connect/i.test(formatError(error))
      ) {
        this.clear();
      }
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
