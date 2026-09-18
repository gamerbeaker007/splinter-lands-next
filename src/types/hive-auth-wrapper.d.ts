declare module "hive-auth-wrapper" {
  interface HiveAuthObject {
    username: string;
    token?: string;
    expire?: number;
    key?: string;
  }

  interface HiveAuthResponse {
    data?: unknown;
    [key: string]: unknown;
  }

  interface HiveAuthApi {
    connect(): Promise<boolean>;
    status(): { host: string; connected: boolean; timeout: number };
    authenticate(
      auth: HiveAuthObject,
      appMeta: { name: string; description: string; icon?: string },
      challengeData?: { key_type: string; challenge: string },
      onWait?: (event: Record<string, unknown>) => void
    ): Promise<HiveAuthResponse>;
    challenge(
      auth: HiveAuthObject,
      challengeData: { key_type: string; challenge: string },
      onWait?: (event: Record<string, unknown>) => void
    ): Promise<HiveAuthResponse>;
    broadcast(
      auth: HiveAuthObject,
      keyType: string,
      operations: unknown[],
      onWait?: (event: Record<string, unknown>) => void
    ): Promise<HiveAuthResponse>;
  }

  const HAS: HiveAuthApi;
  export default HAS;
}
