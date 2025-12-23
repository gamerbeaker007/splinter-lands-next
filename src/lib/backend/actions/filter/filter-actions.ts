"use server";

import { FilterInput } from "@/types/filters";
import { getAvailableFilterValues as getAvailableFilterValuesService } from "@/lib/backend/services/regionService";

/**
 * Get available filter values for the filter drawer.
 */
export async function getAvailableFilterValues(
  player: string | null = null
): Promise<FilterInput> {
  const result = await getAvailableFilterValuesService(player);
  return result;
}
