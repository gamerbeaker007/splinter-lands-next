import {
  buildWorkerPlan,
  PlanCaps,
  WorkerPlanStrategy,
} from "@/lib/shared/workerPlan";
import { computeWorkerEligibility } from "@/lib/shared/workerEligibility";
import { StakingDetail } from "@/generated/prisma/client";
import {
  normalizeWorkerBatchSize,
  WorkerEligiblePlot,
} from "@/types/landManager";
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
