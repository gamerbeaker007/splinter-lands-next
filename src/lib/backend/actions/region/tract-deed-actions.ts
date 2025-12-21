"use server";

import { getCachedRegionDataSSR } from "@/lib/backend/api/internal/deed-data";
import {
  enrichWithProductionInfo,
  enrichWithProgressInfo,
} from "@/lib/backend/services/regionService";
import { getCachedResourcePrices } from "@/lib/backend/services/resourceService";
import { filterDeeds, sortDeeds } from "@/lib/filters";
import { DeedComplete } from "@/types/deed";
import { FilterInput } from "@/types/filters";

export type FilteredTractDeedsResult = {
  deeds: DeedComplete[];
  warning: string | null;
  total: number;
};

/**
 * Phase 1: Fast server action to get filtered and sorted tract deeds WITHOUT staked assets.
 * This is the fast call that returns immediately with basic deed data.
 */
export async function getFilteredEnrichedTractDeeds(
  filters: FilterInput
): Promise<FilteredTractDeedsResult> {
  try {
    const deeds = await getCachedRegionDataSSR();
    const deedsFiltered = filterDeeds(deeds, filters);
    const prices = await getCachedResourcePrices();
    const enriched1 = await enrichWithProgressInfo(deedsFiltered);
    const enrichedDeeds = await enrichWithProductionInfo(enriched1, prices);
    const sortedDeeds = sortDeeds(enrichedDeeds, filters.sorting);

    return {
      deeds: sortedDeeds,
      warning: null,
      total: sortedDeeds.length,
    };
  } catch (err) {
    console.error("Failed to get filtered tract deeds", err);
    throw new Error(
      err instanceof Error ? err.message : "Failed to load filtered tract deeds"
    );
  }
}
