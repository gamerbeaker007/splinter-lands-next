"use server";

import { FilterInput } from "@/types/filters";
import {
  getActiveDeedCountByRegion as getActiveDeedCountByRegionService,
  getRegionSummary as getRegionSummaryService,
} from "@/lib/backend/services/regionService";
import { RegionSummary } from "@/types/regionSummary";

/**
 * Get active deed count by region.
 */
export async function getActiveDeedCountByRegion(
  filters: FilterInput = {}
): Promise<Record<string, { active: number; inactive: number }>> {
  const result = await getActiveDeedCountByRegionService(filters);
  return result;
}

/**
 * Get region summary.
 */
export async function getRegionSummary(
  filters: FilterInput = {}
): Promise<RegionSummary | null> {
  const result = await getRegionSummaryService(filters);
  return result;
}
