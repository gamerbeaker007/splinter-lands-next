import logger from "@/lib/backend/log/logger.server";
import { Client, Operation, PrivateKey } from "@hiveio/dhive";
import { HIVE_BLOCK_MS, MAX_OPS_PER_BROADCAST } from "@/types/landManager";

const DEFAULT_RPC_NODES = [
  "https://api.hive.blog",
  "https://api.openhive.network",
  "https://api.deathwing.me",
];

function resolveNodes(): string[] {
  const env = process.env.HIVE_RPC_NODES?.trim();
  if (!env) return DEFAULT_RPC_NODES;
  return env
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

let cachedClient: Client | null = null;
function getClient(): Client {
  if (!cachedClient) {
    cachedClient = new Client(resolveNodes(), { timeout: 10_000 });
  }
  return cachedClient;
}

function getSigningKey(): PrivateKey {
  const raw = process.env.SPL_LAND_SERVICE_ACTIVE_KEY?.trim();
  if (!raw) throw new Error("SPL_LAND_SERVICE_ACTIVE_KEY not configured");
  return PrivateKey.fromString(raw);
}

export interface ServerBroadcastResult {
  success: boolean;
  txIds: string[];
  error?: string;
}

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

/**
 * Signs and broadcasts a sequence of Hive operations from the configured
 * land-service account. Operations are batched (≤ MAX_OPS_PER_TX per tx) and
 * tx batches are spaced one block apart so all txs land in distinct blocks.
 *
 * Returns the broadcast tx ids — confirmation/lookup is the caller's job.
 */
export async function broadcastOpsAsService(
  operations: Operation[]
): Promise<ServerBroadcastResult> {
  if (operations.length === 0) return { success: true, txIds: [] };
  const client = getClient();
  let key: PrivateKey;
  try {
    key = getSigningKey();
  } catch (err) {
    return {
      success: false,
      txIds: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }

  const txIds: string[] = [];
  const batches = chunk(operations, MAX_OPS_PER_BROADCAST);
  for (let i = 0; i < batches.length; i++) {
    try {
      const tx = await client.broadcast.sendOperations(batches[i], key);
      txIds.push(tx.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error(`broadcastOpsAsService batch ${i} failed: ${message}`);
      return { success: false, txIds, error: message };
    }
    if (i < batches.length - 1) {
      await new Promise((r) => setTimeout(r, HIVE_BLOCK_MS));
    }
  }
  return { success: true, txIds };
}
