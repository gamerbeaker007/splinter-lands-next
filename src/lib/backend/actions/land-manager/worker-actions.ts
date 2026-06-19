"use server";

import { getAuthStatus } from "@/lib/backend/actions/auth-actions";
import {
  fetchRegionDataPlayer,
  fetchStakedAssets,
} from "@/lib/backend/api/spl/spl-land-api";
import {
  BuyPlan,
  RentalPlan,
  WorkerEligibilityResult,
  WorkerEligiblePlot,
} from "@/types/landManager";
import { Card, StakedAssets } from "@/types/stakedAssets";
import pLimit from "p-limit";

export async function getWorkerEligibility(
  enabledRegions: number[]
): Promise<WorkerEligibilityResult> {
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
  const worksiteByDeed = new Map(
    regionData.worksite_details.map((s) => [s.deed_uid, s])
  );
  const enabledSet = new Set(enabledRegions);

  const eligible: WorkerEligiblePlot[] = [];
  const unpoweredSkipped: WorkerEligiblePlot[] = [];

  for (const deed of regionData.deeds) {
    if (!enabledSet.has(deed.region_number)) continue;

    const staking = stakingByDeed.get(deed.deed_uid);
    if (!staking) continue;
    const worksiteDetails = worksiteByDeed.get(deed.deed_uid) ?? null;

    const maxWorkers = staking.max_workers_allowed ?? 0;
    const workerCount = staking.worker_count ?? 0;

    const plot: WorkerEligiblePlot = {
      ...deed,
      worksiteDetail: worksiteDetails,
      stakingDetail: staking,
      worker_count: workerCount,
      max_workers: maxWorkers,
      empty_slots: maxWorkers - workerCount,
      is_powered: staking.is_powered ?? false,
      biome_modifiers: {
        fire: staking.red_biome_modifier ?? 0,
        water: staking.blue_biome_modifier ?? 0,
        life: staking.white_biome_modifier ?? 0,
        death: staking.black_biome_modifier ?? 0,
        earth: staking.green_biome_modifier ?? 0,
        dragon: staking.gold_biome_modifier ?? 0,
      },
    };

    if (plot.is_powered) {
      if (workerCount < maxWorkers) {
        eligible.push(plot);
      }
    } else {
      unpoweredSkipped.push(plot);
    }
  }

  const byRegionThenPlot = (a: WorkerEligiblePlot, b: WorkerEligiblePlot) =>
    a.region_number - b.region_number || a.plot_number - b.plot_number;

  eligible.sort(byRegionThenPlot);
  unpoweredSkipped.sort(byRegionThenPlot);

  return { eligible, unpoweredSkipped };
}

// Only fetch staked assets for plots that actually have picks to stake.
export async function fetchEmptySlotsByDeed(plan: BuyPlan | RentalPlan) {
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
          emptySlotsByDeed[plot.deed_uid] = [];
        }
      })
    )
  );
  return emptySlotsByDeed;
}
