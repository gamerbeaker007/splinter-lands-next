import { getBiomeModifiersFromStakingDetail } from "@/lib/utils/cardUtil";
import {
  WorkerEligibilityResult,
  WorkerEligiblePlot,
} from "@/types/landManager";
import { RawRegionDataResponse } from "@/types/RawRegionDataResponse";

/**
 * Splits plots that have room for more workers into powered eligible plots and
 * otherwise-eligible plots skipped only because they are powered off. Each
 * list is sorted by region then plot number. Pure — runs on the player's own
 * deed read.
 */
export function computeWorkerEligibility(
  regionData: RawRegionDataResponse | null
): WorkerEligibilityResult {
  if (!regionData || regionData.deeds.length === 0)
    return { eligible: [], unpoweredSkipped: [] };

  const stakingByDeed = new Map(
    regionData.staking_details.map((s) => [s.deed_uid, s])
  );
  const worksiteByDeed = new Map(
    regionData.worksite_details.map((s) => [s.deed_uid, s])
  );

  const eligible: WorkerEligiblePlot[] = [];
  const unpoweredSkipped: WorkerEligiblePlot[] = [];

  for (const deed of regionData.deeds) {
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
      biome_modifiers: getBiomeModifiersFromStakingDetail(staking),
    };

    if (workerCount >= maxWorkers) continue;
    if (plot.is_powered) eligible.push(plot);
    else unpoweredSkipped.push(plot);
  }

  const byRegionThenPlot = (a: WorkerEligiblePlot, b: WorkerEligiblePlot) =>
    a.region_number - b.region_number || a.plot_number - b.plot_number;

  eligible.sort(byRegionThenPlot);
  unpoweredSkipped.sort(byRegionThenPlot);

  return { eligible, unpoweredSkipped };
}

/** Keeps only the eligible plots in `deedUids` (no filter when empty/absent). */
export function filterEligiblePlots(
  eligible: WorkerEligiblePlot[],
  deedUids?: string[]
): WorkerEligiblePlot[] {
  if (!deedUids || deedUids.length === 0) return eligible;
  const uidSet = new Set(deedUids);
  return eligible.filter((p) => uidSet.has(p.deed_uid));
}
