"use server";

import { FilterInput } from "@/types/filters";
import { getActiveDeedCountByRegion as getActiveDeedCountByRegionService } from "@/lib/backend/services/regionService";

/**
 * Get active deed count by region.
 */
export async function getActiveDeedCountByRegion(
  filters: FilterInput = {}
): Promise<Record<string, { active: number; inactive: number }>> {
  const result = await getActiveDeedCountByRegionService(filters);
  return result;
}
