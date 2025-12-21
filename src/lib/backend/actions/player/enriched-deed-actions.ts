"use server";

import { getPlayerData } from "@/lib/backend/api/internal/player-data";
import { getCachedStakedAssets } from "@/lib/backend/services/playerService";
import {
  enrichWithProductionInfo,
  enrichWithProgressInfo,
} from "@/lib/backend/services/regionService";
import { getCachedResourcePrices } from "@/lib/backend/services/resourceService";
import { sortDeeds } from "@/lib/filters";
import { DeedComplete } from "@/types/deed";
import { FilterInput } from "@/types/filters";
import pLimit from "p-limit";

const DEED_LIMIT = 200;

export type FilteredDeedsResult = {
  deeds: DeedComplete[];
  warning: string | null;
  total: number;
};

/**
 * Phase 1: Fast server action to get filtered and sorted deeds WITHOUT staked assets.
 * This is the fast call that returns immediately with basic deed data.
 */
export async function getFilteredEnrichedPlayerDeeds(
  player: string,
  filters: FilterInput
): Promise<FilteredDeedsResult> {
  try {
    const deeds: DeedComplete[] = await getPlayerData(player, filters);
    if (!deeds) {
      throw new Error("No deeds found");
    }

    const prices = await getCachedResourcePrices();
    const enriched1 = await enrichWithProgressInfo(deeds);
    const enrichedDeeds = await enrichWithProductionInfo(enriched1, prices);
    const sorted = sortDeeds(enrichedDeeds, filters.sorting);

    const warning =
      sorted.length > DEED_LIMIT
        ? `Showing only ${DEED_LIMIT} of ${sorted.length} deeds due to performance limits.`
        : null;

    const deedsToReturn = sorted.slice(0, DEED_LIMIT);

    return {
      deeds: deedsToReturn,
      warning,
      total: deedsToReturn.length,
    };
  } catch (err) {
    console.error("Failed to get filtered player deeds", err);
    throw new Error(
      err instanceof Error ? err.message : "Failed to load filtered deeds"
    );
  }
}

/**
 * Phase 2 Alternative: Enrich multiple deeds in a batch.
 * More efficient than single calls - processes with concurrency limit.
 */
export async function enrichDeedsWithStakedAssets(
  deeds: DeedComplete[]
): Promise<DeedComplete[]> {
  try {
    // Use same concurrency as original API route (10 parallel requests)
    const limit = pLimit(10);

    const enrichedDeeds = await Promise.all(
      deeds.map((deed) =>
        limit(async () => {
          try {
            const stakedAssets = await getCachedStakedAssets(deed.deed_uid);
            return {
              ...deed,
              stakedAssets,
            };
          } catch (err) {
            console.error(`Error enriching deed ${deed.deed_uid}`, err);
            return deed;
          }
        })
      )
    );
    return enrichedDeeds;
  } catch (err) {
    console.error("Failed to enrich deeds with staked assets", err);
    throw new Error(
      err instanceof Error
        ? err.message
        : "Failed to enrich deeds with staked assets"
    );
  }
}
