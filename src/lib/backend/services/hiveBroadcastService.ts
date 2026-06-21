import logger from "@/lib/backend/log/logger.server";
import {
  Client,
  cryptoUtils,
  Operation,
  PrivateKey,
  SignedTransaction,
  Transaction,
} from "@hiveio/dhive";
import { HIVE_BLOCK_MS, MAX_OPS_PER_BROADCAST } from "@/types/landManager";

const DEFAULT_RPC_NODES = [
  "https://api.hive.blog",
  "https://api.openhive.network",
  "https://api.deathwing.me",
];

// Mirror @hiveio/dhive BroadcastAPI's default tx expiration window.
const TX_EXPIRE_MS = 60_000;

// On-chain verification window for a broadcast that threw — a flaky RPC proxy
// can return an error after the node already accepted the tx, so poll SPL
// before declaring failure. Spaced one block apart.
const VERIFY_POLL_MS = HIVE_BLOCK_MS;
const VERIFY_ATTEMPTS = 7; // ~21s, comfortably covers a block + SPL indexing

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

/** Tri-state confirmation of a broadcast tx, supplied by the caller. */
export type TrxConfirmState = "confirmed" | "failed" | "pending";

export interface BroadcastOpts {
  /**
   * On-chain verifier used to recover from a phantom broadcast failure. When
   * `client.broadcast.send` throws, the node may still have accepted the tx
   * (e.g. an RPC proxy that returns an error *after* the tx is included). If a
   * verifier is supplied, the deterministic tx id is polled with it before the
   * broadcast is declared failed — so a buy/rent that actually landed is never
   * abandoned. Without it, a throw is treated as a hard failure (legacy behavior).
   */
  verify?: (trxId: string) => Promise<TrxConfirmState>;
}

export interface ServerBroadcastResult {
  success: boolean;
  txIds: string[];
  error?: string;
  /**
   * Tx ids that were signed and sent but whose broadcast call threw and could
   * not be confirmed on-chain. They may still land later — surfaced so callers
   * can warn the user / reconcile rather than silently dropping them.
   */
  attemptedTxIds?: string[];
}

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

/**
 * Builds and signs a transaction the same way dhive's `sendOperations` does,
 * but stops short of sending so we can compute the deterministic tx id up
 * front. That id is what lands on-chain, so it lets us verify a throwing
 * broadcast against the chain.
 */
async function buildSignedTx(
  client: Client,
  operations: Operation[],
  key: PrivateKey
): Promise<{ signed: SignedTransaction; trxId: string }> {
  const props = await client.database.getDynamicGlobalProperties();
  const refBlockNum = props.head_block_number & 0xffff;
  const refBlockPrefix = Buffer.from(props.head_block_id, "hex").readUInt32LE(
    4
  );
  const expiration = new Date(
    new Date(props.time + "Z").getTime() + TX_EXPIRE_MS
  )
    .toISOString()
    .slice(0, -5);
  const tx: Transaction = {
    expiration,
    extensions: [],
    operations,
    ref_block_num: refBlockNum,
    ref_block_prefix: refBlockPrefix,
  };
  const signed = client.broadcast.sign(tx, key);
  const trxId = cryptoUtils.generateTrxId(signed);
  return { signed, trxId };
}

/** Poll the verifier until the tx confirms, fails, or the window expires. */
async function confirmLanded(
  trxId: string,
  verify: (trxId: string) => Promise<TrxConfirmState>
): Promise<boolean> {
  for (let attempt = 0; attempt < VERIFY_ATTEMPTS; attempt++) {
    await new Promise((r) => setTimeout(r, VERIFY_POLL_MS));
    let state: TrxConfirmState;
    try {
      state = await verify(trxId);
    } catch {
      continue; // transient lookup error — keep polling
    }
    if (state === "confirmed") return true;
    if (state === "failed") return false;
  }
  return false; // never confirmed within the window
}

/**
 * Signs and broadcasts a sequence of Hive operations from the configured
 * land-service account. Operations are batched (≤ MAX_OPS_PER_TX per tx) and
 * tx batches are spaced one block apart so all txs land in distinct blocks.
 *
 * A throwing broadcast does NOT immediately fail the run: the node may have
 * accepted the tx before the RPC layer errored (the dhive client deliberately
 * does not retry broadcasts to avoid double-spends). When `opts.verify` is
 * supplied, the deterministic tx id is confirmed on-chain before the batch is
 * treated as failed.
 *
 * Returns the broadcast tx ids — final confirmation/lookup is the caller's job.
 */
export async function broadcastOpsAsService(
  operations: Operation[],
  opts?: BroadcastOpts
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
    let signed: SignedTransaction;
    let trxId: string;
    try {
      ({ signed, trxId } = await buildSignedTx(client, batches[i], key));
    } catch (err) {
      // Failed before the tx was sent — nothing reached the network.
      const message = err instanceof Error ? err.message : String(err);
      logger.error(
        `broadcastOpsAsService batch ${i} prepare failed: ${message}`
      );
      return { success: false, txIds, error: message };
    }

    try {
      await client.broadcast.send(signed);
      txIds.push(trxId);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error(
        `broadcastOpsAsService batch ${i} broadcast threw (tx ${trxId}): ${message}`
      );
      // The send threw, but the node may have accepted the tx anyway. Verify
      // on-chain before declaring failure so we don't abandon a tx that landed.
      if (opts?.verify && (await confirmLanded(trxId, opts.verify))) {
        logger.warn(
          `broadcastOpsAsService batch ${i} recovered: tx ${trxId} confirmed on-chain despite RPC error`
        );
        txIds.push(trxId);
      } else {
        return {
          success: false,
          txIds,
          attemptedTxIds: [trxId],
          error: message,
        };
      }
    }

    if (i < batches.length - 1) {
      await new Promise((r) => setTimeout(r, HIVE_BLOCK_MS));
    }
  }
  return { success: true, txIds };
}
