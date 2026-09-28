"use server";

import { FilterInput } from "@/types/filters";
import { getRegionSummary as getRegionSummaryService } from "@/lib/backend/services/regionService";
import { RegionSummary } from "@/types/regionSummary";

/**
 * Get region summary.
 */
export async function getRegionSummary(
  filters: FilterInput = {}
): Promise<RegionSummary | null> {
  return await getRegionSummaryService(filters);
}

export interface LandDecStakeSummary {
  totalDecStaked: number;
  totalDecNeeded: number;
  totalDecInUse: number;
  totalDecSaved: number;
  runiCount: number;
}

/**
 * DEC staked on all land — only the DEC fields of the (unfiltered) region
 * summary, so the top bar does not ship the whole summary to the browser.
 */
export async function getLandDecStakeSummary(): Promise<LandDecStakeSummary | null> {
  const summary = await getRegionSummaryService({});
  if (!summary) return null;
  return {
    totalDecStaked: summary.totalDecStaked,
    totalDecNeeded: summary.totalDecNeeded,
    totalDecInUse: summary.totalDecInUse,
    totalDecSaved: summary.totalDecSaved,
    runiCount: summary.runiCount,
  };
}
