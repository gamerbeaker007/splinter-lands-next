import {
  HOURS_PER_WEEK,
  computePoolHolding,
  computeRegionResourceBalance,
  computeWeeklyConsumption,
  computeWeeklyPoolNeed,
  regionConsumptionPerHour,
  regionProductionPerHour,
  sharesFractionForResource,
} from "@/lib/shared/poolPositionUtils";
import {
  SplProductionOverviewRegion,
  SplRegionOverviewData,
  SplRegionOverviewPlot,
} from "@/types/spl/landManager";
import { SplLandPool, SplPlayerPoolPosition } from "@/types/spl/landPools";
import { describe, expect, it } from "vitest";

// A region can grow part of what it eats, so only the DEFICIT has to be bought
// and deposited. These tests pin that netting: per region, clamped at 0, never
// letting one region's surplus pay for another's shortfall.

const plot = (
  over: Partial<SplRegionOverviewPlot> = {}
): SplRegionOverviewPlot =>
  ({
    is_powered: true,
    resource_symbol: "GRAIN",
    grain_req_per_hour: 0,
    total_base_pp_after_cap: 0,
    ...over,
  }) as SplRegionOverviewPlot;

const overview = (
  plots: SplRegionOverviewPlot[],
  recipes: SplRegionOverviewData["resource_recipes"] = {}
): SplRegionOverviewData =>
  ({ plots, resource_recipes: recipes }) as SplRegionOverviewData;

const region = (
  uid: string,
  perHr: Partial<Record<"GRAIN" | "WOOD" | "STONE" | "IRON", number>> = {}
): SplProductionOverviewRegion =>
  ({
    region_uid: uid,
    name: `Region ${uid}`,
    grain_per_hr: perHr.GRAIN ?? 0,
    wood_per_hr: perHr.WOOD ?? 0,
    stone_per_hr: perHr.STONE ?? 0,
    iron_per_hr: perHr.IRON ?? 0,
  }) as SplProductionOverviewRegion;

/** The standard SPS/RESEARCH/AURA recipe. */
const RECIPE = [
  { symbol: "WOOD", qty: 0.005 },
  { symbol: "STONE", qty: 0.002 },
  { symbol: "IRON", qty: 0.0005 },
];

describe("regionConsumptionPerHour — gross consumption", () => {
  it("sums grain_req_per_hour of every powered plot, grain farms included", () => {
    const consumed = regionConsumptionPerHour(
      overview([
        plot({ resource_symbol: "GRAIN", grain_req_per_hour: 100 }),
        plot({ resource_symbol: "WOOD", grain_req_per_hour: 60 }),
        plot({ resource_symbol: "RESEARCH", grain_req_per_hour: 40 }),
      ])
    );

    expect(consumed.GRAIN).toBeCloseTo(200, 6);
  });

  it("adds recipe inputs from the advanced resources' base PP", () => {
    const consumed = regionConsumptionPerHour(
      overview(
        [
          plot({
            resource_symbol: "RESEARCH",
            grain_req_per_hour: 10,
            total_base_pp_after_cap: 20_000,
          }),
          plot({
            resource_symbol: "SPS",
            grain_req_per_hour: 5,
            total_base_pp_after_cap: 10_000,
          }),
        ],
        { RESEARCH: RECIPE, SPS: RECIPE }
      )
    );

    // 30k PP producing recipe-based resources.
    expect(consumed.WOOD).toBeCloseTo(30_000 * 0.005, 6);
    expect(consumed.STONE).toBeCloseTo(30_000 * 0.002, 6);
    expect(consumed.IRON).toBeCloseTo(30_000 * 0.0005, 6);
    expect(consumed.GRAIN).toBeCloseTo(15, 6);
  });

  it("ignores unpowered plots and TAX worksites", () => {
    const consumed = regionConsumptionPerHour(
      overview(
        [
          plot({
            resource_symbol: "RESEARCH",
            grain_req_per_hour: 100,
            total_base_pp_after_cap: 20_000,
            is_powered: false,
          }),
          plot({
            resource_symbol: "TAX",
            grain_req_per_hour: 0,
            total_base_pp_after_cap: 50_000,
          }),
        ],
        { RESEARCH: RECIPE }
      )
    );

    expect(consumed.GRAIN).toBe(0);
    expect(consumed.WOOD).toBe(0);
    expect(consumed.STONE).toBe(0);
    expect(consumed.IRON).toBe(0);
  });

  it("does NOT subtract the region's own production", () => {
    const plots = [plot({ grain_req_per_hour: 481.875 })];
    const consumed = regionConsumptionPerHour(overview(plots));

    expect(consumed.GRAIN).toBeCloseTo(481.875, 6);
    // Same overview, netted against production, gives a smaller figure — the
    // gross function stays gross.
    const balance = computeRegionResourceBalance(
      region("R81", { GRAIN: 359.37 }),
      overview(plots)
    );
    expect(balance.externalNeedPerHour.GRAIN).toBeLessThan(consumed.GRAIN);
  });
});

describe("regionProductionPerHour", () => {
  it("reads the production-overview rates, natural resources only", () => {
    const produced = regionProductionPerHour(
      region("R1", { GRAIN: 359.37, WOOD: 12, STONE: 3, IRON: 1 })
    );

    expect(produced).toEqual({
      GRAIN: 359.37,
      WOOD: 12,
      STONE: 3,
      IRON: 1,
    });
  });

  it("is all zeroes without a region row", () => {
    expect(regionProductionPerHour(null)).toEqual({
      GRAIN: 0,
      WOOD: 0,
      STONE: 0,
      IRON: 0,
    });
  });
});

describe("computeRegionResourceBalance — external need", () => {
  it("consumes but produces nothing → the whole burn is external", () => {
    const balance = computeRegionResourceBalance(
      region("R1"),
      overview([plot({ grain_req_per_hour: 100 })])
    );

    expect(balance.consumedPerHour.GRAIN).toBe(100);
    expect(balance.producedPerHour.GRAIN).toBe(0);
    expect(balance.externalNeedPerHour.GRAIN).toBe(100);
  });

  it("produces part of what it consumes → only the deficit is external", () => {
    // The region-81 case from the field.
    const balance = computeRegionResourceBalance(
      region("R81", { GRAIN: 359.37 }),
      overview([plot({ grain_req_per_hour: 481.875 })])
    );

    expect(balance.consumedPerHour.GRAIN).toBeCloseTo(481.875, 6);
    expect(balance.producedPerHour.GRAIN).toBeCloseTo(359.37, 6);
    expect(balance.externalNeedPerHour.GRAIN).toBeCloseTo(122.505, 6);
  });

  it("produces exactly what it consumes → external need is 0", () => {
    const balance = computeRegionResourceBalance(
      region("R1", { GRAIN: 250 }),
      overview([plot({ grain_req_per_hour: 250 })])
    );

    expect(balance.externalNeedPerHour.GRAIN).toBe(0);
  });

  it("produces more than it consumes → 0, never negative", () => {
    const balance = computeRegionResourceBalance(
      region("R1", { GRAIN: 1_000, WOOD: 500 }),
      overview([plot({ grain_req_per_hour: 100 })])
    );

    expect(balance.externalNeedPerHour.GRAIN).toBe(0);
    expect(balance.externalNeedPerHour.WOOD).toBe(0);
    // The surplus is visible, but it is not a credit.
    expect(balance.producedPerHour.GRAIN).toBe(1_000);
  });

  it("nets recipe inputs against the region's own wood/stone/iron output", () => {
    const balance = computeRegionResourceBalance(
      region("R1", { WOOD: 60, STONE: 100, IRON: 1 }),
      overview(
        [plot({ resource_symbol: "SPS", total_base_pp_after_cap: 20_000 })],
        { SPS: RECIPE }
      )
    );

    // Consumed: 100 WOOD, 40 STONE, 10 IRON.
    expect(balance.externalNeedPerHour.WOOD).toBeCloseTo(40, 6);
    expect(balance.externalNeedPerHour.STONE).toBe(0);
    expect(balance.externalNeedPerHour.IRON).toBeCloseTo(9, 6);
  });
});

describe("computeWeeklyPoolNeed", () => {
  const REGION_81 = region("R81", { GRAIN: 359.37 });
  const BALANCE_81 = {
    R81: computeRegionResourceBalance(
      REGION_81,
      overview([plot({ grain_req_per_hour: 481.875 })])
    ),
  };

  it("projects the hourly external need over the given hours", () => {
    const at168 = computeWeeklyPoolNeed([REGION_81], BALANCE_81, 168);
    const at139 = computeWeeklyPoolNeed([REGION_81], BALANCE_81, 139);

    expect(at168.perResource.GRAIN).toBeCloseTo(20_580.84, 3);
    expect(at139.perResource.GRAIN).toBeCloseTo(17_028.195, 3);
    expect(at168.externalNeedPerHour.GRAIN).toBeCloseTo(122.505, 6);
  });

  it("defaults to a full 168-hour week", () => {
    const need = computeWeeklyPoolNeed([REGION_81], BALANCE_81);

    expect(need.productionHours).toBe(HOURS_PER_WEEK);
    expect(need.perResource.GRAIN).toBeCloseTo(122.505 * 168, 3);
  });

  it("is far below the gross-consumption figure it replaces", () => {
    const need = computeWeeklyPoolNeed([REGION_81], BALANCE_81);
    const gross = computeWeeklyConsumption([REGION_81], {
      R81: BALANCE_81.R81.consumedPerHour,
    });

    expect(gross.perResource.GRAIN).toBeCloseTo(481.875 * 168, 3);
    expect(need.perResource.GRAIN).toBeLessThan(gross.perResource.GRAIN);
  });

  it("does NOT let one region's surplus cancel another's deficit", () => {
    const deficit = region("A");
    const surplus = region("B", { GRAIN: 1_000 });
    const balances = {
      A: computeRegionResourceBalance(
        deficit,
        overview([plot({ grain_req_per_hour: 100 })])
      ),
      B: computeRegionResourceBalance(
        surplus,
        overview([plot({ grain_req_per_hour: 100 })])
      ),
    };

    const need = computeWeeklyPoolNeed([deficit, surplus], balances, 1);

    // A must import 100/hr; B needs nothing. Globally the two regions produce
    // 1000 and burn 200, yet the pool still has to supply A's 100.
    expect(need.externalNeedPerHour.GRAIN).toBe(100);
    expect(need.perResource.GRAIN).toBe(100);
    // The gross figures are still reported, summed as-is.
    expect(need.consumedPerHour.GRAIN).toBe(200);
    expect(need.producedPerHour.GRAIN).toBe(1_000);
  });

  it("warns about a region with no production data instead of counting it", () => {
    const known = region("A");
    const unknown = region("B");
    const need = computeWeeklyPoolNeed([known, unknown], {
      A: computeRegionResourceBalance(
        known,
        overview([plot({ grain_req_per_hour: 100 })])
      ),
    });

    expect(need.perResource.GRAIN).toBeCloseTo(100 * HOURS_PER_WEEK, 6);
    expect(need.warnings).toHaveLength(1);
    expect(need.warnings[0]).toContain("Region B");
  });
});

// The vesting/withdrawal side is deliberately untouched by the netting work —
// these pin that it still behaves as before.
describe("LP vesting and withdrawal math", () => {
  const pool = {
    token_symbol: "GRAIN",
    resource_quantity: "1000000",
    dec_quantity: "50000",
    total_shares: "10000",
  } as SplLandPool;

  const position = (shares: number, vestingShares: number) =>
    ({ symbol: "GRAIN", shares, vestingShares }) as SplPlayerPoolPosition;

  it("splits a position into locked and unlocked resource/DEC", () => {
    const holding = computePoolHolding(position(1_000, 250), [pool]);

    expect(holding.resource).toBeCloseTo(100_000, 6);
    expect(holding.dec).toBeCloseTo(5_000, 6);
    expect(holding.lockedFraction).toBeCloseTo(0.25, 6);
    expect(holding.unlockedFraction).toBeCloseTo(0.75, 6);
    expect(holding.unlockedResource).toBeCloseTo(75_000, 6);
    expect(holding.unlockedDec).toBeCloseTo(3_750, 6);
  });

  it("caps a withdrawal at the unlocked fraction, minus what is already used", () => {
    const holding = computePoolHolding(position(1_000, 250), [pool]);

    // 10k of 100k = 0.1 of the position, well inside the unlocked 0.75.
    expect(sharesFractionForResource(holding, 10_000)).toBeCloseTo(0.1, 6);
    // Asking for everything still stops at the unlocked part.
    expect(sharesFractionForResource(holding, 100_000)).toBeCloseTo(0.75, 6);
    expect(sharesFractionForResource(holding, 100_000, 0.5)).toBeCloseTo(
      0.25,
      6
    );
    expect(sharesFractionForResource(holding, 100_000, 0.75)).toBe(0);
  });

  it("returns an empty holding when there is no position or pool", () => {
    expect(computePoolHolding(undefined, [pool]).resource).toBe(0);
    expect(computePoolHolding(position(1_000, 0), []).resource).toBe(0);
  });
});
