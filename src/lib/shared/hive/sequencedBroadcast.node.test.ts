import { describeBroadcastError } from "@/lib/shared/hive/broadcastErrors";
import {
  describeSequenceResult,
  runSequencedBroadcast,
  type SequencerDeps,
  type SequencerProgress,
} from "@/lib/shared/hive/sequencedBroadcast";
import { splOpTxIds } from "@/lib/shared/splTrxIds";
import type { TrxLookupOutcome } from "@/types/spl/trx";
import { describe, expect, it } from "vitest";

// ── a simulated chain + SPL, on a fake clock ─────────────────────────────────
//
// Blocks every 3 s. A broadcast lands in the next block. SPL processes blocks
// `splLagBlocks` behind the head (or freezes at `splFrozenAt`). Sleeping
// advances the clock, so minutes of waiting run instantly.

const BLOCK_MS = 3_000;
const GENESIS = 1_000;

interface SimOptions {
  splLagBlocks?: number | ((t: number) => number);
  /** SPL stops processing at this block. */
  splFrozenAt?: number;
  /** Ops SPL rejects. */
  failingOps?: Set<string>;
  /** Ops SPL never records (e.g. the tx was dropped). */
  missingOps?: Set<string>;
  /** Errors thrown by successive broadcast calls (undefined = succeed). */
  broadcastErrors?: unknown[];
  /** The chain status can't be read at all. */
  noChainStatus?: boolean;
}

function simulate(opts: SimOptions = {}) {
  let t = 0;
  const head = () => GENESIS + Math.floor(t / BLOCK_MS);
  const txBlock = new Map<string, number>();
  const broadcasts: { t: number; ops: unknown[] }[] = [];
  const progress: SequencerProgress[] = [];
  let calls = 0;

  const splLast = () => {
    const lag =
      typeof opts.splLagBlocks === "function"
        ? opts.splLagBlocks(t)
        : (opts.splLagBlocks ?? 2);
    const last = head() - lag;
    return opts.splFrozenAt !== undefined
      ? Math.min(last, opts.splFrozenAt)
      : last;
  };

  const deps: SequencerDeps = {
    broadcast: async (ops) => {
      const err = opts.broadcastErrors?.[calls++];
      if (err !== undefined) throw err;
      const id = `tx${broadcasts.length}`;
      broadcasts.push({ t, ops });
      txBlock.set(id, head() + 1);
      return id;
    },
    splLookup: async (opId): Promise<TrxLookupOutcome> => {
      if (opts.missingOps?.has(opId)) return { status: "pending" };
      const block = txBlock.get(opId.replace(/-\d+$/, ""));
      if (block === undefined || splLast() < block)
        return { status: "pending" };
      if (opts.failingOps?.has(opId)) {
        return { status: "failed", error: `SPL rejected ${opId}` };
      }
      return { status: "success", result: {} as never };
    },
    chainStatus: async () => {
      if (opts.noChainStatus) throw new Error("unreachable");
      return { hiveHeadBlock: head(), splLastBlock: splLast() };
    },
    sleep: async (ms) => {
      t += ms;
    },
    now: () => t,
  };

  return {
    deps,
    broadcasts,
    progress,
    onProgress: (p: SequencerProgress) => progress.push(p),
    blockOf: (txId: string) => txBlock.get(txId),
    elapsed: () => t,
  };
}

/** n custom_json-ish ops in batches of 4, like MAX_OPS_PER_BROADCAST. */
function batchesOf(n: number): unknown[][] {
  const ops = Array.from({ length: n }, (_, i) => ["custom_json", { i }]);
  const out: unknown[][] = [];
  for (let i = 0; i < ops.length; i += 4) out.push(ops.slice(i, i + 4));
  return out;
}

/** The error Keychain rejects with when the node hits the per-block limit. */
const KEYCHAIN_LIMIT_ERROR = {
  success: false,
  message:
    "Your transaction returned an error <br/><br/>Error: Account ${a} already submitted ${n} custom json operation(s) this block.",
  error: {
    code: -32003,
    message:
      "Assert Exception:insert_info.first->second <= HIVE_CUSTOM_OP_BLOCK_LIMIT",
    data: {
      code: 10,
      name: "assert_exception",
      stack: [
        {
          format:
            "Account ${a} already submitted ${n} custom json operation(s) this block.",
          data: { a: "player", n: 5 },
        },
      ],
    },
  },
};

// ── tests ─────────────────────────────────────────────────────────────────────

describe("runSequencedBroadcast", () => {
  it("15 ops: every batch lands in a later block than the previous one", async () => {
    const sim = simulate();
    const res = await runSequencedBroadcast(batchesOf(15), sim.deps);

    expect(res.outcome).toBe("completed");
    expect(sim.broadcasts.map((b) => b.ops.length)).toEqual([4, 4, 4, 3]);
    const blocks = res.txIds.map((id) => sim.blockOf(id)!);
    for (let i = 1; i < blocks.length; i++) {
      expect(blocks[i]).toBeGreaterThan(blocks[i - 1]);
    }
    expect(res.confirmedOpTxIds).toEqual(res.opTxIds);
    expect(res.opTxIds).toHaveLength(15);
  });

  it("sends batch k+1 only after SPL confirmed all of batch k", async () => {
    const sim = simulate({ splLagBlocks: 8 });
    const confirmedAt: number[] = [];
    const lookup = sim.deps.splLookup;
    sim.deps.splLookup = async (id) => {
      const out = await lookup(id);
      if (out.status === "success" && /^tx0(-3)?$/.test(id)) {
        confirmedAt.push(sim.elapsed());
      }
      return out;
    };
    await runSequencedBroadcast(batchesOf(8), sim.deps);
    expect(sim.broadcasts[1].t).toBeGreaterThanOrEqual(
      Math.max(...confirmedAt)
    );
  });

  it("stops at the first SPL failure and keeps what already went through", async () => {
    const failing = new Set(["tx1-2"]); // batch 2, op 3
    const sim = simulate({ failingOps: failing });
    const res = await runSequencedBroadcast(batchesOf(15), sim.deps);

    expect(res.outcome).toBe("failed");
    expect(sim.broadcasts).toHaveLength(2); // batches 3 and 4 never sent
    expect(res.confirmedBatches).toBe(1);
    expect(res.confirmedOpTxIds).toEqual([
      ...splOpTxIds("tx0", 4),
      "tx1",
      "tx1-1",
      "tx1-3",
    ]);
    expect(describeSequenceResult(res)).toBe(
      "Stopped at batch 2 of 4 (7 earlier operations went through): SPL rejected tx1-2 The remaining batches were not sent."
    );
  });

  it("retries once after the next block on the per-block custom op limit", async () => {
    const sim = simulate({
      broadcastErrors: [undefined, KEYCHAIN_LIMIT_ERROR],
    });
    const res = await runSequencedBroadcast(batchesOf(8), sim.deps, {
      onProgress: sim.onProgress,
    });

    expect(res.outcome).toBe("completed");
    expect(
      sim.progress.some((p) => p.phase === "retrying" && p.batch === 2)
    ).toBe(true);
    expect(sim.broadcasts).toHaveLength(2);
  });

  it("gives up after a second per-block limit error, without sending later batches", async () => {
    const sim = simulate({
      broadcastErrors: [undefined, KEYCHAIN_LIMIT_ERROR, KEYCHAIN_LIMIT_ERROR],
    });
    const res = await runSequencedBroadcast(batchesOf(12), sim.deps);

    expect(res.outcome).toBe("failed");
    expect(sim.broadcasts).toHaveLength(1);
    expect(res.error).toContain(
      "only 5 custom operations per account per block"
    );
  });

  it("waits as long as SPL keeps advancing, even 2 minutes behind", async () => {
    const sim = simulate({ splLagBlocks: 40 }); // 2 min behind the head
    const res = await runSequencedBroadcast(batchesOf(8), sim.deps, {
      onProgress: sim.onProgress,
    });

    expect(res.outcome).toBe("completed");
    expect(sim.elapsed()).toBeGreaterThan(2 * 2 * 60_000); // two batches × ~2 min
    expect(
      sim.progress.find((p) => p.phase === "confirming")?.splBlocksBehind
    ).toBe(40);
  });

  it("reports unconfirmed when SPL stops processing, and sends nothing more", async () => {
    const sim = simulate({ splFrozenAt: GENESIS }); // never reaches our block
    const res = await runSequencedBroadcast(batchesOf(8), sim.deps);

    expect(res.outcome).toBe("unconfirmed");
    expect(sim.broadcasts).toHaveLength(1);
    expect(res.unconfirmedOpTxIds).toEqual(splOpTxIds("tx0", 4));
    expect(res.error).toContain("stopped processing blocks");
    expect(describeSequenceResult(res)).toContain("may still land");
  });

  it("reports unconfirmed when SPL is past the tx expiry without a record of it", async () => {
    const sim = simulate({ missingOps: new Set(["tx0-1"]) });
    const res = await runSequencedBroadcast(batchesOf(8), sim.deps);

    expect(res.outcome).toBe("unconfirmed");
    expect(res.confirmedOpTxIds).toEqual(["tx0", "tx0-2", "tx0-3"]);
    expect(res.unconfirmedOpTxIds).toEqual(["tx0-1"]);
  });

  it("still completes when the chain status can't be read", async () => {
    const sim = simulate({ noChainStatus: true });
    const res = await runSequencedBroadcast(batchesOf(8), sim.deps);
    expect(res.outcome).toBe("completed");
  });

  it("stops as unconfirmed when the chain status stays unreadable and SPL has no record", async () => {
    const sim = simulate({ noChainStatus: true, splFrozenAt: GENESIS });
    const res = await runSequencedBroadcast(batchesOf(8), sim.deps);
    expect(res.outcome).toBe("unconfirmed");
    expect(sim.broadcasts).toHaveLength(1);
  });

  it("a Keychain cancel stops the run as cancelled", async () => {
    const sim = simulate({
      broadcastErrors: [
        undefined,
        {
          success: false,
          error: "user_cancel",
          message: "Request was canceled by the user.",
        },
      ],
    });
    const res = await runSequencedBroadcast(batchesOf(12), sim.deps);
    expect(res.outcome).toBe("cancelled");
    expect(res.confirmedBatches).toBe(1);
  });

  it("an ambiguous broadcast error is unconfirmed, never failed", async () => {
    const sim = simulate({
      broadcastErrors: [
        {
          success: false,
          message: "Error while broadcasting the transaction",
          error: {},
        },
      ],
    });
    const res = await runSequencedBroadcast(batchesOf(4), sim.deps);
    expect(res.outcome).toBe("unconfirmed");
  });
});

describe("describeBroadcastError", () => {
  it("names the per-block limit and drops Keychain's markup", () => {
    const info = describeBroadcastError(KEYCHAIN_LIMIT_ERROR);
    expect(info.kind).toBe("custom_op_limit");
    expect(info.definite).toBe(true);
    expect(info.message).not.toMatch(/\$\{|<br/);
  });

  it("fills fc placeholders for other node errors", () => {
    const info = describeBroadcastError({
      success: false,
      message: "Your transaction returned an error <br/><br/>Error: x ${who}",
      error: {
        data: {
          stack: [
            { format: "Missing authority for ${who}", data: { who: "bob" } },
          ],
        },
      },
    });
    expect(info).toEqual({
      kind: "other",
      message: "Missing authority for bob",
      definite: true,
    });
  });

  it("strips the HTML when only Keychain's message is there", () => {
    expect(
      describeBroadcastError({
        success: false,
        message: "Your transaction returned an error <br/><br/>Error: Bad op",
      }).message
    ).toBe("Bad op");
  });
});

describe("runSequencedBroadcast — ops SPL does not process", () => {
  const hiveTransfer = ["transfer", { to: "x", amount: "1.000 HIVE" }];

  it("a HIVE transfer doesn't wait for SPL and is in neither list", async () => {
    const sim = simulate();
    let splLookups = 0;
    sim.deps.splLookup = async () => {
      splLookups++;
      return { status: "pending" };
    };
    const res = await runSequencedBroadcast([[hiveTransfer]], sim.deps);

    expect(res.outcome).toBe("completed");
    expect(res.confirmedOpTxIds).toEqual([]);
    expect(res.unconfirmedOpTxIds).toEqual([]);
    expect(splLookups).toBe(0);
  });

  it("a batch mixing SPL ops and a transfer waits for the SPL ops", async () => {
    const sim = simulate();
    const res = await runSequencedBroadcast(
      [[["custom_json", {}], hiveTransfer], ...batchesOf(4)],
      sim.deps
    );
    expect(res.outcome).toBe("completed");
    expect(res.confirmedOpTxIds).toEqual(["tx0", ...splOpTxIds("tx1", 4)]);
  });
});
