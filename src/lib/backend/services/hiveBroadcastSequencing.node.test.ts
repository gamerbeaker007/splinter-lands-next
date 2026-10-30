import { Operation, PrivateKey } from "@hiveio/dhive";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { broadcastOpsAsService } from "./hiveBroadcastService";

// ── a fake Hive node ──────────────────────────────────────────────────────────
//
// `send` puts a tx in the pending pool; `find_transaction` reports it in a
// block (and takes it out of the pool). Signing is dhive's real crypto.
// `maxPending` is the most service txs ever pending at once: Hive's limit of
// 5 custom ops per account per block is counted over that pool.

const chain = vi.hoisted(() => ({
  pending: new Set<string>(),
  included: new Set<string>(),
  maxPending: 0,
  /** Behaviour per send call, in order (undefined = accept). */
  sendScript: [] as ("accept-then-throw" | "reject" | "limit" | undefined)[],
  sends: 0,
  /** find_transaction answers per tx id that override the pool. */
  findOverride: new Map<string, string | Error>(),
  /** Every find_transaction call throws this, when set. */
  findError: undefined as Error | undefined,
  /** Throws from getDynamicGlobalProperties from this call on. */
  propsFailFrom: Infinity,
  propsCalls: 0,
  /** Trx id of each send call, in order. */
  sent: [] as string[],
}));

vi.mock("@hiveio/dhive", async (importOriginal) => {
  const real = await importOriginal<typeof import("@hiveio/dhive")>();
  class Client {
    private readonly signer = new real.Client(["https://api.hive.blog"]);
    database = {
      getDynamicGlobalProperties: async () => {
        if (chain.propsCalls++ >= chain.propsFailFrom) {
          throw new Error("node down");
        }
        return {
          head_block_number: 1000,
          head_block_id: "000003e8deadbeefcafebabe0123456789abcdef",
          time: "2026-10-30T00:00:00",
        };
      },
    };
    broadcast = {
      sign: (tx: never, key: never) => this.signer.broadcast.sign(tx, key),
      send: async (signed: never) => {
        const id = real.cryptoUtils.generateTrxId(signed);
        chain.sent.push(id);
        const step = chain.sendScript[chain.sends++];
        if (step === "limit") {
          throw new Error(
            "Account svc already submitted 5 custom json operation(s) this block."
          );
        }
        if (step === "reject") throw new Error("socket hang up");
        chain.pending.add(id);
        chain.maxPending = Math.max(chain.maxPending, chain.pending.size);
        if (step === "accept-then-throw") throw new Error("socket hang up");
        return {};
      },
    };
    transaction = {
      findTransaction: async (id: string) => {
        if (chain.findError) throw chain.findError;
        const forced = chain.findOverride.get(id);
        if (forced instanceof Error) throw forced;
        if (forced) return { status: forced };
        if (chain.pending.delete(id)) chain.included.add(id);
        return {
          status: chain.included.has(id)
            ? "within_reversible_block"
            : "unknown",
        };
      },
    };
  }
  return { ...real, Client };
});

// The real logger writes errors to the DB.
vi.mock("@/lib/backend/log/logger.server", () => ({
  default: { info: () => {}, warn: () => {}, error: () => {} },
}));

// No real block waits in a unit test.
vi.mock("@/types/landManager", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  HIVE_BLOCK_MS: 0,
}));
vi.mock("@/lib/shared/hive/splCatchUp", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  HIVE_BLOCK_SECONDS: 0,
}));

process.env.SPL_LAND_SERVICE_ACTIVE_KEY = PrivateKey.fromSeed(
  "hiveBroadcastSequencing-test"
).toString();

/** n distinct custom_json ops; `tag` keeps two requests' tx ids apart. */
function ops(n: number, tag: string): Operation[] {
  return Array.from({ length: n }, (_, i) => [
    "custom_json",
    {
      required_auths: ["svc"],
      required_posting_auths: [],
      id: "sm_market_rent",
      json: JSON.stringify({ tag, i }),
    },
  ]);
}

beforeEach(() => {
  chain.pending.clear();
  chain.included.clear();
  chain.maxPending = 0;
  chain.sendScript = [];
  chain.sends = 0;
  chain.findOverride.clear();
  chain.findError = undefined;
  chain.propsFailFrom = Infinity;
  chain.propsCalls = 0;
  chain.sent = [];
});

describe("broadcastOpsAsService", () => {
  it("concurrent requests never have two service txs pending at once", async () => {
    const [a, b] = await Promise.all([
      broadcastOpsAsService(ops(12, "a")),
      broadcastOpsAsService(ops(12, "b")),
    ]);
    expect(a.success && b.success).toBe(true);
    expect(a.txIds).toHaveLength(3);
    expect(b.txIds).toHaveLength(3);
    expect(chain.maxPending).toBe(1);
  });

  it("a send that threw but reached the chain is recovered", async () => {
    chain.sendScript = [undefined, "accept-then-throw"];
    const res = await broadcastOpsAsService(ops(8, "x"));
    expect(res.success).toBe(true);
    expect(res.txIds).toEqual(chain.sent);
    expect(res.opTxIds).toHaveLength(8);
  });

  it("an expired batch after a throw reports nothing attempted", async () => {
    chain.sendScript = ["reject"];
    const pending = broadcastOpsAsService(ops(4, "z"));
    // Let the send run, then make the node report the tx as expired.
    await vi.waitFor(() => expect(chain.sent).toHaveLength(1));
    chain.findOverride.set(chain.sent[0], "expired_reversible");
    const res = await pending;
    expect(res.success).toBe(false);
    expect(res.txIds).toEqual([]);
    expect(res.attemptedTxIds).toBeUndefined();
    expect(res.error).toBe("socket hang up");
  });

  it("a tx the node can't place reports it as attempted", async () => {
    chain.sendScript = ["accept-then-throw"];
    chain.findError = new Error("lookup down");
    const res = await broadcastOpsAsService(ops(4, "u"));
    expect(res.success).toBe(false);
    expect(res.attemptedTxIds).toEqual(chain.sent);
  });

  it("retries the per-block limit once with a fresh signature", async () => {
    chain.sendScript = ["limit"];
    const res = await broadcastOpsAsService(ops(4, "v"));
    expect(res.success).toBe(true);
    expect(chain.sent).toHaveLength(2);
  });

  it("a limit rejection whose re-sign fails reports nothing attempted", async () => {
    chain.sendScript = ["limit"];
    chain.propsFailFrom = 1; // the second buildSignedTx can't read the head
    const res = await broadcastOpsAsService(ops(4, "w"));
    expect(res.success).toBe(false);
    expect(res.txIds).toEqual([]);
    expect(res.attemptedTxIds).toBeUndefined();
    expect(res.error).toBe("node down");
  });
});
