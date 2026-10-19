import {
  buildWorkerPlan,
  isWithinWorkerCap,
  PlanCaps,
  priceBuyListing,
  priceRentalListing,
  selectCandidateTuples,
  WorkerPlanStrategy,
} from "@/lib/shared/workerPlan";
import { computeWorkerEligibility } from "@/lib/shared/workerEligibility";
import { StakingDetail } from "@/generated/prisma/client";
import {
  normalizeWorkerBatchSize,
  WorkerEligiblePlot,
} from "@/types/landManager";
import {
  SplMarketListing,
  SplMarketListingGrouped,
} from "@/types/spl/marketListing";
import { SplCardDetails } from "@/types/splCardDetails";
import { describe, expect, it } from "vitest";

function makePlot(index: number): WorkerEligiblePlot {
  return {
    deed_uid: `plot-${index}`,
    map_name: "praetoria",
    region_id: 1,
    tract_id: 1,
    plot_id: index,
    region_number: 1,
    tract_number: 1,
    plot_number: index,
    territory: "centerra",
    region_uid: "region-1",
    resource_id: null,
    resource_symbol: "GRAIN",
    magic_type: null,
    stats: null,
    player: "worker-plan-test",
    created_date: null,
    listed: false,
    lock_days: null,
    unlock_date: null,
    in_use: null,
    deed_type: "praetoria",
    land_stats: null,
    region_name: "Centerra",
    market_updated_date: null,
    market_id: null,
    listing_price: null,
    market_listing_id: null,
    market_listing_status_id: null,
    castle: null,
    keep: null,
    rarity: "common",
    plot_status: "natural",
    hex_code: null,
    tax_rate: null,
    item_detail_id: null,
    created_block_num: null,
    created_tx: null,
    worksite_type: "Grain Farm",
    time_crystal_value: null,
    rarity_sort_value: null,
    is_construction: false,
    worksiteDetail: null,
    stakingDetail: null,
    worker_count: 0,
    max_workers: 5,
    empty_slots: 5,
    is_powered: true,
    biome_modifiers: {
      fire: 0,
      water: 0,
      life: 0,
      death: 0,
      earth: 0,
      dragon: 0,
    },
  };
}

const emptyCandidateStrategy: WorkerPlanStrategy<null> = {
  label: "test",
  loadCandidates: async () => ({
    tuples: [],
    cards: [],
    groupedCount: 0,
    ctx: null,
    warnings: [],
  }),
  fetchListings: async () => [],
  priceListing: () => null,
};

function makeListing(buy_price: number, currency: string): SplMarketListing {
  return {
    market_id: "market-1",
    card_id: "card-1",
    uid: "worker-1",
    card_detail_id: 1,
    edition: 7,
    foil: 0,
    gold: false,
    level: 1,
    bcx: 1,
    xp: 0,
    buy_price,
    price_bcx: buy_price,
    fee_percent: 0,
    seller: "seller",
    type: "SELL",
    rental_type: "season",
    expiration_date: "2026-11-01T00:00:00.000Z",
    currency,
    land_base_pp: "100",
  };
}

describe("worker plan batch size", () => {
  it("normalizes legacy and oversized settings to the supported range", () => {
    expect(normalizeWorkerBatchSize(null)).toBe(100);
    expect(normalizeWorkerBatchSize(0)).toBe(100);
    expect(normalizeWorkerBatchSize(135)).toBe(100);
    expect(normalizeWorkerBatchSize(0.7)).toBe(1);
  });

  it("processes at most 100 plots even when the planner receives a larger batch", async () => {
    const caps: PlanCaps = {
      batchSize: 135,
      maxTotalDec: 0,
      maxPerWorker: 0,
      minLandBasePp: 0,
      minFoil: 0,
      requireTerrainBoost: false,
    };

    const plan = await buildWorkerPlan(
      Array.from({ length: 135 }, (_, index) => makePlot(index)),
      caps,
      emptyCandidateStrategy
    );

    expect(plan.items).toHaveLength(100);
    expect(plan.totals.plots_total).toBe(100);
    expect(plan.warnings[0]).toContain("first 100 of 135 eligible plots");
  });

  it("counts unpowered plots only when they otherwise have worker slots available", () => {
    const result = computeWorkerEligibility({
      deeds: [makePlot(1), makePlot(2), makePlot(3)],
      worksite_details: [],
      staking_details: [
        {
          deed_uid: "plot-1",
          is_powered: false,
          max_workers_allowed: 5,
          worker_count: 2,
        },
        {
          deed_uid: "plot-2",
          is_powered: true,
          max_workers_allowed: 5,
          worker_count: 2,
        },
        {
          deed_uid: "plot-3",
          is_powered: false,
          max_workers_allowed: 5,
          worker_count: 5,
        },
      ] as StakingDetail[],
    });

    expect(result.eligible.map((entry) => entry.deed_uid)).toEqual(["plot-2"]);
    expect(result.unpoweredSkipped.map((entry) => entry.deed_uid)).toEqual([
      "plot-1",
    ]);
  });
});

describe("per-worker cost caps", () => {
  it("applies buy caps to DEC-converted listing cost, not the USD sticker price", () => {
    const affordableUsd = priceBuyListing(makeListing(4.5, "USD"), 0.0015);
    const overCapUsd = priceBuyListing(makeListing(5, "USD"), 0.0015);
    const overCapDec = priceBuyListing(makeListing(3000.01, "DEC"), 0.0015);

    expect(affordableUsd?.worker_cap_cost).toBe(3000);
    expect(isWithinWorkerCap(affordableUsd!, 3000)).toBe(true);
    expect(overCapUsd?.worker_cap_cost).toBeCloseTo(3333.333);
    expect(isWithinWorkerCap(overCapUsd!, 3000)).toBe(false);
    expect(isWithinWorkerCap(overCapDec!, 3000)).toBe(false);
  });

  it("keeps rental caps on DEC/day rather than total rental cost", () => {
    const pricing = priceRentalListing(
      makeListing(300, "DEC"),
      { rental_days: 14, source: "test" },
      0.0015
    );
    const overDailyCap = priceRentalListing(
      makeListing(3000.01, "DEC"),
      { rental_days: 14, source: "test" },
      0.0015
    );

    expect(pricing?.total_dec).toBe(4200);
    expect(pricing?.worker_cap_cost).toBe(300);
    expect(isWithinWorkerCap(pricing!, 3000)).toBe(true);
    expect(isWithinWorkerCap(overDailyCap!, 3000)).toBe(false);
  });
});

describe("candidate selection", () => {
  const caps: PlanCaps = {
    batchSize: 10,
    maxTotalDec: 0,
    maxPerWorker: 0,
    minLandBasePp: 0,
    minFoil: 3,
    requireTerrainBoost: false,
  };

  function makeCard(id: number, no_pp: boolean): SplCardDetails {
    return { id, rarity: 1, tier: 14, color: "Red", no_pp } as SplCardDetails;
  }

  function makeGrouped(
    card_detail_id: number,
    edition: number,
    low_price: number
  ): SplMarketListingGrouped {
    return {
      card_detail_id,
      gold: false,
      foil: 3,
      edition,
      qty: 1,
      level: 10,
      low_price_bcx: low_price / 38,
      low_price,
      high_price: low_price,
      mana: 4,
      season_qty: 0,
      daily_qty: 0,
    };
  }

  it("skips no_pp cards, which list with land_base_pp 0", () => {
    // The no_pp Conclave Rewards card is cheaper, so it would rank first.
    const { tuples } = selectCandidateTuples(
      [makeGrouped(871, 18, 10), makeGrouped(717, 14, 50)],
      [makeCard(871, true), makeCard(717, false)],
      [makePlot(1).biome_modifiers],
      caps
    );

    expect(tuples.map((t) => t.card_detail_id)).toEqual([717]);
  });
});
