/**
 * Dev-only page for visually testing buildRentalPlan with real API data.
 *
 * No auth, no DB required — only the public Splinterlands market APIs are used.
 * Returns 404 in production.
 *
 * URL params (all optional):
 *   max_dec          – max_total_dec (default 0 = unlimited)
 *   max_per_worker   – max_dec_per_day_per_worker (default 0 = unlimited)
 *   min_pp           – min_land_base_pp (default 0)
 *   min_foil         – min_foil rank 0=Regular 1=Gold (default 0)
 *   batch            – rental_batch_size (default 3)
 *   plots            – number of synthetic test plots to generate (default 3)
 *
 * Example:
 *   /dev/rental-plan?max_dec=200&min_pp=50&plots=5
 */
import { buildRentalPlan } from "@/lib/backend/services/landRentalService";
import { RentalConfig, RentalEligiblePlot } from "@/types/landManager";
import { TERRAIN_BONUS } from "@/types/planner/primitives";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import RentalPlanDevView from "./RentalPlanDevView";

// ── Synthetic test plots ───────────────────────────────────────────────────
const TERRAIN_TYPES = Object.keys(TERRAIN_BONUS);

// Use TERRAIN_BONUS values directly as biome_modifiers for each terrain type.
const BIOME_CYCLES: Array<Record<string, number>> = TERRAIN_TYPES.map(
  (terrain) =>
    TERRAIN_BONUS[terrain as keyof typeof TERRAIN_BONUS] as Record<
      string,
      number
    >
);

// BIOME overwrite use all the same modifiers to simplify testing — we just want to verify that biome modifiers are applied, not test each individual terrain type
// const BIOME_CYCLES: Array<Record<string, number>> = TERRAIN_TYPES.map(
//   () =>
//     ({ fire: 0.1, life: -0.5, death: 0.1, earth: -0.5 }) as Record<
//       string,
//       number
//     >
// );

const RESOURCES = ["GRAIN", "WOOD", "STONE", "IRON", "AURA"];

function makePlot(i: number): RentalEligiblePlot {
  return {
    deed_uid: `dev-test-plot-${i + 1}`,
    plot_id: 900000 + i,
    plot_number: i + 1,
    tract_id: 1,
    tract_number: 1,
    region_id: 1,
    region_number: 1,
    region_uid: "DEV-1",
    region_name: "Dev Test Region",
    map_name: "praetoria",
    territory: "test",
    resource_id: 1,
    resource_symbol: RESOURCES[i % RESOURCES.length],
    magic_type: null,
    stats: null,
    deed_type: TERRAIN_TYPES[i % TERRAIN_TYPES.length],
    land_stats: null,
    worksite_type: "Grain Farm",
    rarity: "common",
    rarity_sort_value: 1,
    hex_code: null,
    tax_rate: "0.10",
    item_detail_id: 100,
    time_crystal_value: 1000,
    player: "dev-test-user",
    created_date: null,
    listed: false,
    lock_days: null,
    unlock_date: null,
    in_use: true,
    market_updated_date: null,
    market_id: null,
    listing_price: null,
    market_listing_id: null,
    market_listing_status_id: null,
    castle: null,
    keep: null,
    plot_status: "occupied",
    created_block_num: null,
    created_tx: null,
    is_construction: false,
    worksiteDetail: null,
    stakingDetail: null,
    worker_count: 0,
    max_workers: 5,
    empty_slots: 5,
    is_powered: true,
    biome_modifiers: BIOME_CYCLES[i % BIOME_CYCLES.length],
  };
}

// ── Page ──────────────────────────────────────────────────────────────────
interface SearchParams {
  max_dec?: string;
  max_per_worker?: string;
  min_pp?: string;
  min_foil?: string;
  batch?: string;
  plots?: string;
}

function RentalPlanLoading() {
  return <div style={{ padding: 16 }}>Building rental plan...</div>;
}

async function RentalPlanDevContent({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const numPlots = Number(params.plots ?? 3);
  const eligible: RentalEligiblePlot[] = Array.from(
    { length: numPlots },
    (_, i) => makePlot(i)
  );

  const config: RentalConfig = {
    strategy: "highest_pp_per_dec",
    max_total_dec: Number(params.max_dec ?? 0),
    max_dec_per_day_per_worker: Number(params.max_per_worker ?? 0),
    min_land_base_pp: Number(params.min_pp ?? 0),
    min_foil: Number(params.min_foil ?? 0),
    rental_batch_size: Number(params.batch ?? 3),
  };

  const plan = await buildRentalPlan(eligible, config);

  return <RentalPlanDevView plan={plan} config={config} />;
}

export default function RentalPlanDevPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  if (process.env.NODE_ENV !== "development") notFound();

  return (
    <Suspense fallback={<RentalPlanLoading />}>
      <RentalPlanDevContent searchParams={searchParams} />
    </Suspense>
  );
}
