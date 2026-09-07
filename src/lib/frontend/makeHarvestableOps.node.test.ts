import {
  buildMakeHarvestableOps,
  DRIFT_COVER_MINUTES,
  MIN_TOPUP_MARGIN,
} from "@/lib/frontend/makeHarvestableOps";
import {
  SplHarvestableResource,
  SplProductionOverviewRegion,
  SplRegionOverviewData,
  SplRegionOverviewPlot,
} from "@/types/spl/landManager";
import { SplLandPool } from "@/types/spl/landPools";
import { describe, expect, it } from "vitest";

// A harvest cost is not a fixed number — it accrues between the moment the plan
// is built and the moment the player actually presses Harvest All. These tests
// pin that the buy is sized for that drift, and that a small buy is not rounded
// back under the shortfall it was meant to cover.

// Live-ish pool depth (mainnet, Sep 2026 order of magnitude).
const pool = (
  symbol: string,
  decQty: number,
  resourceQty: number
): SplLandPool =>
  ({
    id: 1,
    token_symbol: symbol,
    dec_quantity: String(decQty),
    resource_quantity: String(resourceQty),
    total_shares: "1000000",
  }) as SplLandPool;

const POOLS = [
  pool("GRAIN", 40_256_520, 4_945_943_948),
  pool("WOOD", 26_730_791, 1_079_563_949),
  pool("STONE", 20_236_936, 299_831_366),
  pool("IRON", 22_103_911, 114_905_595),
];

const region = (uid: string): SplProductionOverviewRegion =>
  ({
    region_uid: uid,
    name: `Region ${uid}`,
    grain_per_hr: 0,
    wood_per_hr: 0,
    stone_per_hr: 0,
    iron_per_hr: 0,
  }) as SplProductionOverviewRegion;

/** A region that burns `grainPerHour` GRAIN feeding its workers and grows none. */
const overview = (grainPerHour: number): SplRegionOverviewData =>
  ({
    plots: [
      {
        is_powered: true,
        resource_symbol: "WOOD",
        grain_req_per_hour: grainPerHour,
        total_base_pp_after_cap: 0,
      } as SplRegionOverviewPlot,
    ],
    resource_recipes: {},
  }) as SplRegionOverviewData;

const harvestable = (grainCost: number): SplHarvestableResource[] => [
  {
    amount_claimable: 0,
    grain_required_for_food: grainCost,
    wood_required: 0,
    stone_required: 0,
    iron_required: 0,
    token_symbol: "WOOD",
  },
];

/** GRAIN actually delivered into R1 by the plan. */
function grainBought(
  result: ReturnType<typeof buildMakeHarvestableOps>
): number {
  return result.actions
    .filter((a) => a.type === "buy_dec" && a.to_symbol === "GRAIN")
    .reduce((sum, a) => sum + a.out_amount, 0);
}

function plan(
  grainCost: number,
  storedGrain: number,
  overviews?: Record<string, SplRegionOverviewData>
) {
  return buildMakeHarvestableOps(
    [region("R1")],
    "player",
    { R1: harvestable(grainCost) },
    {
      effective: { R1: { GRAIN: storedGrain, WOOD: 0, STONE: 0, IRON: 0 } },
      stored: { R1: { GRAIN: storedGrain, WOOD: 0, STONE: 0, IRON: 0 } },
    },
    ["buy_dec"],
    1_000_000,
    POOLS,
    { overviews }
  );
}

describe("buildMakeHarvestableOps — buy_dec sizing", () => {
  it("buys at least the shortfall even when it is a fraction of a unit", () => {
    // Sizing off `deficit * 1.02` and rounding the DEC input to the nearest
    // 0.001 used to return 0.995 GRAIN for a 1 GRAIN shortfall.
    for (const shortfall of [0.5, 1, 2, 3, 5, 10]) {
      const result = plan(1_000 + shortfall, 1_000);
      expect(grainBought(result)).toBeGreaterThanOrEqual(shortfall);
    }
  });

  it("never buys less than the absolute minimum margin", () => {
    const result = plan(1_100, 1_000);
    expect(grainBought(result)).toBeGreaterThanOrEqual(100 + MIN_TOPUP_MARGIN);
  });

  it("covers the shortfall growth of a fast-burning region", () => {
    // 4,000 GRAIN/hr burn, 500 short: 2% of the shortfall is 10 GRAIN, but the
    // region eats 66 GRAIN a minute while the player confirms and harvests.
    const burnPerHour = 4_000;
    const result = plan(100_000, 99_500, { R1: overview(burnPerHour) });

    const drift = (burnPerHour * DRIFT_COVER_MINUTES) / 60;
    expect(grainBought(result)).toBeGreaterThanOrEqual(500 + drift);
  });

  it("survives a worst-case 2.5% slippage fill and still clears the cost", () => {
    const result = plan(100_000, 99_500, { R1: overview(4_000) });
    const worstCaseFill = grainBought(result) * (1 - 0.025);
    expect(99_500 + worstCaseFill).toBeGreaterThanOrEqual(100_000);
  });

  it("falls back to the relative buffer when no overviews are supplied", () => {
    const result = plan(100_000, 99_500);
    const bought = grainBought(result);
    expect(bought).toBeGreaterThanOrEqual(500);
    // No burn rate known → no drift cover, so the buy stays close to the
    // shortfall rather than silently over-buying.
    expect(bought).toBeLessThan(600);
  });

  it("emits no operation when the region is already covered", () => {
    expect(plan(1_000, 1_000).ops).toHaveLength(0);
  });
});
