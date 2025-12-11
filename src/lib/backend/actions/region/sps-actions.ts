import { getCachedRegionDataSSR } from "../../api/internal/deed-data";

/**
 * Get Daily SPS ratio this is average of (rewards_per_hour / (boostedPP * site_efficiency)) for all deeds producing SPS
 * This number can be used to determine the estimated SPS rewards based on boostedPP and site efficiency.
 */
export async function getDailySPSRatio(): Promise<number> {
  const blob = await getCachedRegionDataSSR();

  const resource = ["SPS"];
  const { filterDeeds } = await import("@/lib/filters");
  const filteredDeeds = filterDeeds(blob, { filter_resources: resource });

  const ratios: number[] = [];

  for (const deed of filteredDeeds) {
    const boostedPP = deed.stakingDetail?.total_harvest_pp ?? 0;
    const rewards_per_hour = deed.worksiteDetail?.rewards_per_hour ?? 0;
    const site_efficiency = deed.worksiteDetail?.site_efficiency ?? 0;

    if (boostedPP > 0 && site_efficiency > 0.01 && rewards_per_hour > 0) {
      const ratio = rewards_per_hour / (boostedPP * site_efficiency);
      if (!isNaN(ratio) && isFinite(ratio)) {
        ratios.push(ratio);
      }
    }
  }

  const avg =
    ratios.length > 0
      ? ratios.reduce((sum, r) => sum + r, 0) / ratios.length
      : 0;

  return avg;
}
