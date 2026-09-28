import {
  fragmentsIn,
  harvestRewardsFrom,
  laborsLuckIn,
} from "@/lib/shared/harvestRewards";
import type {
  HarvestAllDeedResult,
  LaborsLuckTreasure,
  SplTrxResult,
} from "@/types/spl/trx";
import { describe, expect, it } from "vitest";

const CARD: LaborsLuckTreasure = {
  uid: "G19-866-2632A608C0",
  card_detail_id: 866,
  xp: 1,
  gold: true,
  tier: 19,
  foil: 1,
  mint: null,
};

function deed(treasure?: LaborsLuckTreasure | null): HarvestAllDeedResult {
  return {
    deed_uid: "d",
    labors_luck_treasure: treasure,
  } as HarvestAllDeedResult;
}

const harvestAll = (
  ...treasures: (LaborsLuckTreasure | null)[]
): SplTrxResult => ({
  op: "harvest_all",
  result: {
    success: true,
    message: "",
    results: treasures.map(deed),
    deeds: [],
    num_worksite_transitions: 0,
  },
});

const taxCollection = (
  deedUid: string,
  found: boolean,
  type: string | null
): SplTrxResult => ({
  op: "tax_collection",
  result: {
    deed_uid: deedUid,
    kingdom_type: "keep",
    elapsed_hours: 1,
    tokens: [],
    fragment_found: found,
    fragment_chance: 0.1,
    fragment_roll: 0.05,
    fragment_type: type,
  },
});

describe("harvestRewards", () => {
  it("collects Labor's Luck cards from harvest_all and skips pending txs", () => {
    expect(laborsLuckIn([harvestAll(null, CARD), null, undefined])).toEqual([
      CARD,
    ]);
  });

  it("collects cards from the DEC power-up auto-harvest too", () => {
    const powerUp = {
      op: "dec_powerup_region",
      result: { harvest_results: [deed(CARD)] },
    } as unknown as SplTrxResult;
    expect(laborsLuckIn([powerUp])).toEqual([CARD]);
  });

  it("only counts fragments the engine confirmed with a type", () => {
    const found = fragmentsIn([
      taxCollection("a", true, "TOTEMFC"),
      taxCollection("b", false, null),
      taxCollection("c", true, null),
    ]);
    expect([...found]).toEqual([["a", "TOTEMFC"]]);
  });

  it("returns cards first, then fragments, with stable keys", () => {
    const rewards = harvestRewardsFrom([
      taxCollection("keep-1", true, "TOTEMFL"),
      harvestAll(CARD),
    ]);
    expect(rewards.map((r) => r.key)).toEqual([
      "card:G19-866-2632A608C0",
      "fragment:keep-1",
    ]);
  });

  it("returns nothing for a run without special drops", () => {
    expect(
      harvestRewardsFrom([harvestAll(null), taxCollection("a", false, null)])
    ).toEqual([]);
  });
});
