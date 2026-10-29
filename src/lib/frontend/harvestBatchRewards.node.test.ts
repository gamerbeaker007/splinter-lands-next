import { parseTrxInfo } from "@/lib/shared/spl/trxLookupParser";
import { broadcastKeepsThenCastles } from "@/lib/frontend/broadcastMythicHarvest";
import { getBroadcastRun } from "@/lib/frontend/broadcastProgress";
import { broadcastHarvest } from "@/lib/frontend/executeHarvestFlow";
import {
  broadcastOperations,
  waitForTransactions,
} from "@/lib/frontend/splBroadcast";
import {
  HARVEST_MYTHICS_PRODUCTION_LOOKUPS,
  HARVEST_MYTHICS_PRODUCTION_OPS_PER_TX,
  HARVEST_MYTHICS_PRODUCTION_TX_IDS,
} from "@/lib/shared/fixtures/harvestMythicsProductionBatch";
import { fragmentsIn, harvestRewardsFrom } from "@/lib/shared/harvestRewards";
import { buildTaxCollectionOp } from "@/lib/shared/operations/opBuilders";
import { hiveTxIdOf, hiveTxIdsOf, splOpTxIds } from "@/lib/shared/splTrxIds";
import type { SplTrxInfo, SplTrxResult } from "@/types/spl/trx";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── fakes: only Keychain and the SPL lookup endpoint ─────────────────────────
//
// Everything between them — batching, SPL op ids, polling, parsing, reward
// extraction — is the production code under test.

const keychain = vi.hoisted(() => ({
  /** Hive tx ids Keychain "returns", one per broadcast call. */
  txIds: [] as string[],
  /** Ops passed to each broadcast call. */
  calls: [] as object[][],
}));

vi.mock("keychain-sdk", () => ({
  KeychainKeyTypes: { posting: "Posting", active: "Active" },
  KeychainSDK: class {
    async broadcast({ operations }: { operations: object[] }) {
      keychain.calls.push(operations);
      const id = keychain.txIds[keychain.calls.length - 1];
      return { success: true, result: { id } };
    }
  },
}));

const lookups = vi.hoisted(() => ({
  byId: {} as Record<string, unknown>,
}));

// The real lookup is an HTTP call; replay captured trx_info envelopes
// through the real parser instead. An id SPL does not know reads as pending,
// exactly like the live endpoint ("Transaction [...] not found").
vi.mock("@/lib/frontend/spl-browser-api", async () => {
  const { parseTrxInfo } = await import("@/lib/shared/spl/trxLookupParser");
  return {
    splBrowser: {
      fetchTransactionLookup: async (id: string) =>
        parseTrxInfo(lookups.byId[id] as SplTrxInfo | undefined),
    },
  };
});

// SPL is caught up: every lookup above is final.
vi.mock("@/lib/backend/actions/land-manager/chain-status-actions", () => ({
  getChainStatusAction: async () => ({
    hiveHeadBlock: 1_000,
    splLastBlock: 1_000,
  }),
}));

// No real block waits in a unit test.
vi.mock("@/types/landManager", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  HIVE_BLOCK_MS: 0,
  TRX_VERIFY_POLL_MS: 0,
}));

beforeEach(() => {
  keychain.txIds = [];
  keychain.calls = [];
  lookups.byId = {};
  vi.stubGlobal("window", { hive_keychain: {} });
});

// ── helpers ───────────────────────────────────────────────────────────────────

function countFragments(results: (SplTrxResult | null | undefined)[]) {
  const counts: Record<string, number> = {};
  for (const reward of harvestRewardsFrom(results))
    if (reward.kind === "fragment")
      counts[reward.fragmentType] = (counts[reward.fragmentType] ?? 0) + 1;
  return counts;
}

/** The tax_collection ops of the production run, rebuilt from the fixture. */
function productionOps(): [string, object][] {
  return HARVEST_MYTHICS_PRODUCTION_TX_IDS.flatMap((txId) =>
    splOpTxIds(txId, HARVEST_MYTHICS_PRODUCTION_OPS_PER_TX).map((opId) => {
      const input = JSON.parse(HARVEST_MYTHICS_PRODUCTION_LOOKUPS[opId].data);
      return buildTaxCollectionOp(
        "player",
        input.region_uid,
        input.deed_uids[0]
      );
    })
  );
}

function kingdomOf(opId: string): string {
  const outer = JSON.parse(HARVEST_MYTHICS_PRODUCTION_LOOKUPS[opId].result);
  return outer.result.data.kingdom_type;
}

const EXPECTED = { TOTEMFR: 6, TOTEMFE: 2, TOTEMFC: 1 };

// ── tests ─────────────────────────────────────────────────────────────────────

describe("splOpTxIds", () => {
  it("keeps the Hive tx id for op 0 and suffixes the rest", () => {
    expect(splOpTxIds("abc", 4)).toEqual(["abc", "abc-1", "abc-2", "abc-3"]);
    expect(splOpTxIds("abc", 1)).toEqual(["abc"]);
  });

  it("maps an op id back to its Hive tx id", () => {
    expect(hiveTxIdOf("abc")).toBe("abc");
    expect(hiveTxIdOf("abc-3")).toBe("abc");
    expect(hiveTxIdsOf(["abc", "abc-1", "def", "abc-2"])).toEqual([
      "abc",
      "def",
    ]);
  });
});

describe("Harvest Mythics — production batch of 2026-10-11", () => {
  beforeEach(() => {
    keychain.txIds = [...HARVEST_MYTHICS_PRODUCTION_TX_IDS];
    lookups.byId = { ...HARVEST_MYTHICS_PRODUCTION_LOOKUPS };
  });

  it("the fixture holds 44 confirmed ops with 9 fragments (6 R, 2 E, 1 C)", () => {
    const all = Object.values(HARVEST_MYTHICS_PRODUCTION_LOOKUPS).map((info) =>
      parseTrxInfo(info)
    );
    expect(all).toHaveLength(44);
    expect(all.every((o) => o.status === "success")).toBe(true);
    expect(
      countFragments(all.map((o) => (o.status === "success" ? o.result : null)))
    ).toEqual(EXPECTED);
  });

  it("reveals all 9 fragment rolls once every op is looked up by its SPL id", async () => {
    const res = await broadcastOperations("player", productionOps());

    expect(res.success).toBe(true);
    expect(keychain.calls.map((ops) => ops.length)).toEqual(Array(11).fill(4));
    expect(res.txIds).toEqual(HARVEST_MYTHICS_PRODUCTION_TX_IDS);
    expect(res.opTxIds).toHaveLength(44);

    const confirmed = await waitForTransactions(res.opTxIds);
    expect(countFragments(confirmed)).toEqual(EXPECTED);
    expect(fragmentsIn(confirmed).size).toBe(9);
    expect(harvestRewardsFrom(confirmed)).toHaveLength(9);
  });

  it("reproduces the bug: looking up Hive tx ids yields only the 2 Rare fragments", async () => {
    const res = await broadcastOperations("player", productionOps());
    const firstOpsOnly = await waitForTransactions(res.txIds);
    expect(countFragments(firstOpsOnly)).toEqual({ TOTEMFR: 2 });
    expect([...fragmentsIn(firstOpsOnly).keys()]).toEqual([
      "I-292-4cb5fcb6fb5eb1", // b5d568d3… op 0, keep
      "I-298-2f45bdb1465b6c", // 39100f4f… op 0, castle
    ]);
  });

  it("harvests every keep before any castle", async () => {
    const res = await broadcastOperations("player", productionOps());
    const kinds = res.opTxIds.map(kingdomOf);
    expect(kinds.lastIndexOf("keep")).toBeLessThan(kinds.indexOf("castle"));
    expect(kinds.filter((k) => k === "keep")).toHaveLength(40);
    expect(kinds.filter((k) => k === "castle")).toHaveLength(4);
  });

  it("Today panel: the stored op ids map back to the 11 Hive txs for hivehub links", async () => {
    const res = await broadcastOperations("player", productionOps());
    // The day log stores res.opTxIds; the panel looks each one up directly.
    const confirmed = await waitForTransactions(res.opTxIds);
    expect(countFragments(confirmed)).toEqual(EXPECTED);
    expect(hiveTxIdsOf(res.opTxIds)).toEqual(HARVEST_MYTHICS_PRODUCTION_TX_IDS);
  });
});

// ── synthetic batches: any op position, any rarity, any flow ─────────────────

function taxEnvelope(
  id: string,
  deedUid: string,
  fragmentType: string | null,
  success = true
): SplTrxInfo {
  return {
    id,
    type: "land_operation",
    player: "player",
    data: JSON.stringify({ op: "tax_collection", deed_uids: [deedUid] }),
    result: JSON.stringify({
      success: true,
      result: {
        success: true,
        data: {
          deed_uid: deedUid,
          kingdom_type: "keep",
          tokens: { tokens: [] },
          fragment_found: fragmentType !== null,
          fragment_type: fragmentType ?? undefined,
        },
      },
    }),
    success,
    error: success ? null : "Engine rejected the op",
    created_date: "2026-10-11T00:00:00.000Z",
  };
}

function harvestAllEnvelope(
  id: string,
  treasureUid: string | null
): SplTrxInfo {
  return {
    id,
    type: "land_operation",
    player: "player",
    data: JSON.stringify({ op: "harvest_all" }),
    result: JSON.stringify({
      success: true,
      result: {
        success: true,
        data: {
          success: true,
          results: [
            {
              deed_uid: `deed-${id}`,
              labors_luck_treasure: treasureUid
                ? { uid: treasureUid, card_detail_id: 866, foil: 0 }
                : null,
            },
          ],
        },
      },
    }),
    success: true,
    error: null,
    created_date: "2026-10-11T00:00:00.000Z",
  };
}

describe("batched harvests — rewards at every op position", () => {
  it("Harvest Mythics: every rarity, several drops per Hive tx", async () => {
    const drops = ["TOTEMFL", null, "TOTEMFE", "TOTEMFR", "TOTEMFC", "TOTEMFR"];
    keychain.txIds = ["tx-a", "tx-b"];
    const opIds = [...splOpTxIds("tx-a", 4), ...splOpTxIds("tx-b", 2)];
    opIds.forEach((id, i) => {
      lookups.byId[id] = taxEnvelope(id, `deed-${i}`, drops[i]);
    });

    const res = await broadcastOperations(
      "player",
      drops.map((_, i) => buildTaxCollectionOp("player", "R", `deed-${i}`))
    );
    expect(res.opTxIds).toEqual(opIds);
    const confirmed = await waitForTransactions(res.opTxIds);
    expect(countFragments(confirmed)).toEqual({
      TOTEMFL: 1,
      TOTEMFE: 1,
      TOTEMFR: 2,
      TOTEMFC: 1,
    });
  });

  it("Harvest All: Labor's Luck cards beyond op 0 are revealed", async () => {
    keychain.txIds = ["ha-1", "ha-2"];
    const opIds = [...splOpTxIds("ha-1", 4), ...splOpTxIds("ha-2", 2)];
    const treasures = [null, null, "C19-866-AAA", null, null, "G19-866-BBB"];
    opIds.forEach((id, i) => {
      lookups.byId[id] = harvestAllEnvelope(id, treasures[i]);
    });

    const regions = treasures.map((_, i) => ({
      region_uid: `R-${i}`,
      region_number: i,
      name: `Region ${i}`,
    }));
    const res = await broadcastHarvest("player", regions);

    expect(res.success).toBe(true);
    expect(res.txIds).toEqual(["ha-1", "ha-2"]);
    // The run's progress is gone once the broadcast returns.
    expect(getBroadcastRun()).toBeNull();
    expect(harvestRewardsFrom(res.results ?? []).map((r) => r.key)).toEqual([
      "card:C19-866-AAA",
      "card:G19-866-BBB",
    ]);
  });

  it("a rejected op behind op 0 now fails verification instead of passing", async () => {
    keychain.txIds = ["tx-f"];
    const [op0, op1, op2] = splOpTxIds("tx-f", 3);
    lookups.byId[op0] = taxEnvelope(op0, "d0", null);
    lookups.byId[op1] = taxEnvelope(op1, "d1", null);
    lookups.byId[op2] = taxEnvelope(op2, "d2", null, false);

    const res = await broadcastOperations(
      "player",
      ["d0", "d1", "d2"].map((d) => buildTaxCollectionOp("player", "R", d))
    );
    // The sequencer itself now stops on SPL's verdict, keeping what landed.
    expect(res.success).toBe(false);
    expect(res.error).toContain("Engine rejected the op");
    expect(res.confirmedOpTxIds).toEqual([op0, op1]);
    await expect(waitForTransactions(res.txIds)).resolves.toHaveLength(1);
    await expect(waitForTransactions(res.opTxIds)).rejects.toThrow(
      "Engine rejected the op"
    );
  });
});

describe("Harvest Mythics — keeps before castles", () => {
  function kingdomsOf(call: object[]): string[] {
    return call.map(
      (op) =>
        JSON.parse(
          (op as [string, { json: string }])[1].json
        ).deed_uids[0].split(":")[0]
    );
  }

  it("confirms every keep before broadcasting the first castle", async () => {
    // 5 keeps (not a multiple of 4) interleaved with 2 castles.
    const deeds = [
      "keep",
      "castle",
      "keep",
      "keep",
      "castle",
      "keep",
      "keep",
    ].map((kingdom_type, i) => ({
      deed_uid: `${kingdom_type}:${i}`,
      region_uid: "R",
      kingdom_type: kingdom_type as "keep" | "castle",
    }));
    keychain.txIds = ["k-1", "k-2", "c-1"];
    const opIds = [
      ...splOpTxIds("k-1", 4),
      ...splOpTxIds("k-2", 1),
      ...splOpTxIds("c-1", 2),
    ];
    opIds.forEach((id) => {
      lookups.byId[id] = taxEnvelope(id, id, null);
    });

    // Record when each castle broadcast starts relative to keep confirmation.
    const keepOps = new Set(opIds.slice(0, 5));
    const confirmedKeeps = new Set<string>();
    const lookup = lookups.byId;
    lookups.byId = new Proxy(lookup, {
      get(target, id: string) {
        if (keepOps.has(id)) confirmedKeeps.add(id);
        return target[id];
      },
    });
    const keepsConfirmedAtCastleBroadcast: number[] = [];
    const phases: string[] = [];

    const res = await broadcastKeepsThenCastles("player", deeds, (phase) => {
      phases.push(phase);
      if (phase === "running" && phases.length > 1)
        keepsConfirmedAtCastleBroadcast.push(confirmedKeeps.size);
    });

    expect(res.success).toBe(true);
    expect(keychain.calls.map(kingdomsOf)).toEqual([
      ["keep", "keep", "keep", "keep"],
      ["keep"],
      ["castle", "castle"],
    ]);
    expect(phases).toEqual(["running", "verifying", "running", "verifying"]);
    expect(keepsConfirmedAtCastleBroadcast).toEqual([5]);
    expect(res.opTxIds).toEqual(opIds);
    expect(res.confirmed).toHaveLength(7);
  });

  it("does not broadcast castles when the keep broadcast is rejected", async () => {
    keychain.txIds = [];
    const deeds = [
      { deed_uid: "keep:0", region_uid: "R", kingdom_type: "keep" as const },
      {
        deed_uid: "castle:1",
        region_uid: "R",
        kingdom_type: "castle" as const,
      },
    ];
    const { KeychainSDK } = await import("keychain-sdk");
    const spy = vi
      .spyOn(KeychainSDK.prototype, "broadcast")
      .mockResolvedValueOnce({ success: false, error: "user_cancel" } as never);

    const res = await broadcastKeepsThenCastles("player", deeds);
    expect(res.success).toBe(false);
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});
