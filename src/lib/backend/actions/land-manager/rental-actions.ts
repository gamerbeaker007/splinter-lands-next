"use server";
import {
  fetchRegionDataPlayer,
  fetchStakedAssets,
} from "@/lib/backend/api/spl/spl-land-api";
import { buildRentalPlan } from "@/lib/backend/services/landRentalService";
import {
  DEFAULT_RENTAL_CONFIG,
  RentalConfig,
  RentalEligiblePlot,
  RentalEligibilityResult,
  RentalPlan,
} from "@/types/landManager";
import { Card, StakedAssets } from "@/types/stakedAssets";
import pLimit from "p-limit";
import { getAuthStatus } from "../auth-actions";

const DEFAULT_MAX_WORKERS = 5;

export async function getRentalEligibility(
  enabledRegions: number[]
): Promise<RentalEligibilityResult> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) {
    return { eligible: [], unpoweredSkipped: [] };
  }

  if (enabledRegions.length === 0) {
    return { eligible: [], unpoweredSkipped: [] };
  }

  const regionData = await fetchRegionDataPlayer(auth.username);
  const stakingByDeed = new Map(
    regionData.staking_details.map((s) => [s.deed_uid, s])
  );
  const enabledSet = new Set(enabledRegions);

  const eligible: RentalEligiblePlot[] = [];
  const unpoweredSkipped: RentalEligiblePlot[] = [];

  for (const deed of regionData.deeds) {
    if (!enabledSet.has(deed.region_number)) continue;

    const staking = stakingByDeed.get(deed.deed_uid);
    if (!staking) continue;

    const maxWorkers = staking.max_workers_allowed ?? DEFAULT_MAX_WORKERS;
    if (maxWorkers <= 0) continue; // not a worker plot (e.g. castle/keep)

    const workerCount = staking.worker_count ?? 0;
    if (workerCount >= maxWorkers) continue;

    const plot: RentalEligiblePlot = {
      deed_uid: deed.deed_uid,
      plot_id: deed.plot_id,
      plot_number: deed.plot_number,
      tract_number: deed.tract_number,
      region_uid: deed.region_uid,
      region_number: deed.region_number,
      resource_symbol: deed.resource_symbol ?? null,
      worker_count: workerCount,
      max_workers: maxWorkers,
      empty_slots: maxWorkers - workerCount,
      is_powered: staking.is_powered ?? false,
      biome_modifiers: {
        red: staking.red_biome_modifier ?? 0,
        blue: staking.blue_biome_modifier ?? 0,
        white: staking.white_biome_modifier ?? 0,
        black: staking.black_biome_modifier ?? 0,
        green: staking.green_biome_modifier ?? 0,
        gold: staking.gold_biome_modifier ?? 0,
      },
    };

    if (plot.is_powered) {
      eligible.push(plot);
    } else {
      unpoweredSkipped.push(plot);
    }
  }

  const byRegionThenPlot = (a: RentalEligiblePlot, b: RentalEligiblePlot) =>
    a.region_number - b.region_number || a.plot_number - b.plot_number;

  eligible.sort(byRegionThenPlot);
  unpoweredSkipped.sort(byRegionThenPlot);

  return { eligible, unpoweredSkipped };
}

export interface RegionAlertInfo {
  region_number: number;
  region_uid: string;
  total_plot_count: number;
  unpowered_plot_count: number;
  dec_stake_needed: number;
  dec_stake_in_use: number;
}

export async function getRegionAlerts(
  enabledRegions: number[]
): Promise<RegionAlertInfo[]> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) return [];
  if (enabledRegions.length === 0) return [];

  const regionData = await fetchRegionDataPlayer(auth.username);
  const stakingByDeed = new Map(
    regionData.staking_details.map((s) => [s.deed_uid, s])
  );
  const enabledSet = new Set(enabledRegions);

  const byRegion = new Map<number, RegionAlertInfo>();
  for (const deed of regionData.deeds) {
    if (!enabledSet.has(deed.region_number)) continue;
    const staking = stakingByDeed.get(deed.deed_uid);
    if (!staking) continue;

    let info = byRegion.get(deed.region_number);
    if (info) {
      info.dec_stake_needed += staking.total_dec_stake_needed ?? 0;
      info.dec_stake_in_use += staking.total_dec_stake_in_use ?? 0;
    } else {
      info = {
        region_number: deed.region_number,
        region_uid: deed.region_uid,
        total_plot_count: 0,
        unpowered_plot_count: 0,
        dec_stake_needed: staking.total_dec_stake_needed ?? 0,
        dec_stake_in_use: staking.total_dec_stake_in_use ?? 0,
      };
      byRegion.set(deed.region_number, info);
    }
    info.total_plot_count += 1;

    if (!(staking.is_powered ?? false)) info.unpowered_plot_count += 1;
  }

  return [...byRegion.values()].sort(
    (a, b) => a.region_number - b.region_number
  );
}

export async function getRentalDryRunPlan(
  enabledRegions: number[],
  rental: RentalConfig = DEFAULT_RENTAL_CONFIG
): Promise<RentalPlan> {
  const eligibility = await getRentalEligibility(enabledRegions);
  return buildRentalPlan(eligibility.eligible, rental);
}

export interface RentalExecutionPlan {
  plan: RentalPlan;
  // deed_uid -> ordered list of empty slot numbers (1-based).
  emptySlotsByDeed: Record<string, number[]>;
}

export async function getRentalExecutionPlan(
  enabledRegions: number[],
  rental: RentalConfig = DEFAULT_RENTAL_CONFIG
): Promise<RentalExecutionPlan> {
  const eligibility = await getRentalEligibility(enabledRegions);
  const plan = await buildRentalPlan(eligibility.eligible, rental);

  // Only fetch staked assets for plots that actually have picks to stake.
  const deedsToFetch = plan.items
    .filter((i) => i.picks.length > 0)
    .map((i) => i.plot);

  const emptySlotsByDeed: Record<string, number[]> = {};
  const limit = pLimit(5);

  await Promise.all(
    deedsToFetch.map((plot) =>
      limit(async () => {
        try {
          const assets: StakedAssets | undefined = await fetchStakedAssets(
            plot.deed_uid
          );
          const occupied = new Set<number>(
            (assets?.cards ?? []).map((c: Card) => c.slot)
          );
          const all = Array.from({ length: plot.max_workers }, (_, i) => i + 1);
          emptySlotsByDeed[plot.deed_uid] = all.filter((s) => !occupied.has(s));
        } catch {
          // Fall back to "no slot info" — execution layer will skip this deed.
          emptySlotsByDeed[plot.deed_uid] = [];
        }
      })
    )
  );

  return { plan, emptySlotsByDeed };
}
