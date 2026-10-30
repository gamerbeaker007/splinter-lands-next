import logger from "@/lib/backend/log/logger.server";
import { describeBroadcastError } from "@/lib/shared/hive/broadcastErrors";
import {
  type HiveTxStatus,
  waitForInclusion,
} from "@/lib/shared/hive/waitForInclusion";
import {
  applyDevPrefixToOps,
  LooseOp,
} from "@/lib/shared/operations/devPrefix";
import {
  Client,
  cryptoUtils,
  Operation,
  PrivateKey,
  SignedTransaction,
  Transaction,
} from "@hiveio/dhive";
import { splOpTxIds } from "@/lib/shared/splTrxIds";
import { HIVE_BLOCK_MS, MAX_OPS_PER_BROADCAST } from "@/types/landManager";

const DEFAULT_RPC_NODES = [
  "https://api.hive.blog",
  "https://api.openhive.network",
  "https://api.deathwing.me",
];

// Mirror @hiveio/dhive BroadcastAPI's default tx expiration window
// (BroadcastAPI.expireTime). See buildSignedTx for why we replicate it.
const TX_EXPIRE_MS = 60_000;

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
  /** Hive transaction ids — one per broadcast batch. */
  txIds: string[];
  /**
   * SPL transaction id of every op that landed, in op order. A Hive tx id only
   * resolves the batch's first op — see `splOpTxIds`.
   */
  opTxIds?: string[];
  error?: string;
  /**
   * Tx ids that were sent but not seen in a block: they may still land —
   * surfaced so callers can warn the user rather than silently dropping them.
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
 *
 * IMPORTANT: this hand-replicates @hiveio/dhive 1.3.6's
 * `BroadcastAPI.sendOperations` tx construction (ref_block_num / ref_block_prefix
 * / expiration via TX_EXPIRE_MS, empty extensions) — see
 * node_modules/@hiveio/dhive/lib/helpers/broadcast.js. If a dhive upgrade changes
 * that construction or its serialization/signing, the tx id we compute here will
 * no longer match what the node indexes and the verify-on-throw recovery silently
 * stops working. hiveBroadcastService.node.test.ts pins the id for fixed inputs
 * so such a drift fails CI before it can ship. Re-verify against dhive and update
 * the golden value there intentionally when bumping dhive.
 *
 * Exported only for that test.
 */
export async function buildSignedTx(
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

const sleep = (ms: number): Promise<void> =>
  new Promise((r) => setTimeout(r, ms));

/**
 * Every player's on-behalf ops are signed by this one service account, which
 * Hive allows 5 custom ops per block — counted over the node's pending pool.
 * Concurrent requests (`withServiceBroadcastSlot` allows several) therefore
 * take turns: one batch at a time, released once it is in a block.
 */
let accountQueue: Promise<unknown> = Promise.resolve();
function withAccountLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = accountQueue.then(fn);
  accountQueue = run.catch(() => undefined);
  return run;
}

type BatchOutcome =
  | { landed: true; trxId: string }
  /** `trxId` set: sent but not seen in a block — it may still land. */
  | { landed: false; trxId?: string; error: string };

/**
 * Signs, sends and waits until one batch is in a block. A send that throws
 * isn't trusted either way: a flaky RPC proxy can error after the node
 * accepted the tx, so its deterministic id is looked up on the chain
 * (`find_transaction` with the expiration is definitive within it). Only the
 * per-block limit is a certain rejection: re-signed and sent once more a
 * block later.
 */
async function sendBatch(
  client: Client,
  ops: Operation[],
  key: PrivateKey
): Promise<BatchOutcome> {
  let signed: SignedTransaction;
  let trxId: string;
  let sendError: string | undefined;
  for (let attempt = 0; ; attempt++) {
    try {
      ({ signed, trxId } = await buildSignedTx(client, ops, key));
    } catch (err) {
      // Failed before the tx was sent — nothing reached the network.
      return { landed: false, error: errorText(err) };
    }
    try {
      await client.broadcast.send(signed);
      sendError = undefined;
    } catch (err) {
      sendError = errorText(err);
      if (describeBroadcastError(err).kind === "custom_op_limit") {
        if (attempt > 0) return { landed: false, error: sendError };
        logger.warn(
          "broadcastOpsAsService hit the per-block custom op limit, retrying after a block"
        );
        await sleep(HIVE_BLOCK_MS);
        continue;
      }
      logger.error(
        `broadcastOpsAsService send threw (tx ${trxId}), checking the chain: ${sendError}`
      );
    }
    break;
  }

  const expiration = signed.expiration;
  const inclusion = await waitForInclusion(
    trxId,
    {
      findTransaction: async (id) =>
        (await client.transaction.findTransaction(id, expiration))
          .status as HiveTxStatus,
      sleep,
      now: Date.now,
    },
    TX_EXPIRE_MS + HIVE_BLOCK_MS
  );
  if (inclusion === "included") {
    if (sendError) {
      logger.warn(
        `broadcastOpsAsService recovered: tx ${trxId} is on-chain despite the RPC error`
      );
    }
    return { landed: true, trxId };
  }
  if (inclusion === "expired") {
    return {
      landed: false,
      error:
        sendError ??
        "The transaction expired before it was included in a block.",
    };
  }
  return {
    landed: false,
    trxId,
    error:
      sendError ?? "Hive did not confirm that the transaction is in a block.",
  };
}

function errorText(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * Signs and broadcasts a sequence of Hive operations from the configured
 * land-service account. Operations are batched (≤ MAX_OPS_PER_BROADCAST per
 * tx), and each batch is sent under the account lock and waited on until it
 * is in a block (`sendBatch`), so no two batches — of this request or a
 * concurrent one — share the account's per-block limit.
 *
 * Stops at the first batch that didn't land; earlier batches stay in
 * `txIds`/`opTxIds`. Returns the broadcast tx ids — SPL's verdict is the
 * caller's job (the browser's `waitForTransactions`).
 */
export async function broadcastOpsAsService(
  operations: Operation[]
): Promise<ServerBroadcastResult> {
  if (operations.length === 0) return { success: true, txIds: [], opTxIds: [] };
  const client = getClient();
  let key: PrivateKey;
  try {
    key = getSigningKey();
  } catch (err) {
    return { success: false, txIds: [], error: errorText(err) };
  }

  const txIds: string[] = [];
  const opTxIds: string[] = [];
  const prefixed = applyDevPrefixToOps(
    operations as unknown as LooseOp[]
  ) as unknown as Operation[];
  const batches = chunk(prefixed, MAX_OPS_PER_BROADCAST);
  for (let i = 0; i < batches.length; i++) {
    const outcome = await withAccountLock(() =>
      sendBatch(client, batches[i], key)
    );
    if (!outcome.landed) {
      logger.error(`broadcastOpsAsService batch ${i} failed: ${outcome.error}`);
      return {
        success: false,
        txIds,
        opTxIds,
        error: outcome.error,
        ...(outcome.trxId ? { attemptedTxIds: [outcome.trxId] } : {}),
      };
    }
    txIds.push(outcome.trxId);
    opTxIds.push(...splOpTxIds(outcome.trxId, batches[i].length));
  }
  return { success: true, txIds, opTxIds };
}
