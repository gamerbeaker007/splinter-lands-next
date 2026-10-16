"use server";

import { getCachedRegionDataSSR } from "@/lib/backend/api/internal/deed-data";
import { getCachedResourcePrices } from "@/lib/backend/services/resourceService";
import { filterDeeds } from "@/lib/filters";
import { processPlayerTaxIncome } from "@/lib/shared/player/playerRegion";
import { RegionTaxSummary } from "@/types/resource";

/**
 * Get player tax income data (region-wide DB data, no SPL call). The player's
 * region summary itself is computed in the browser (`loadPlayerRegionData`).
 */
export async function getPlayerTaxData(
  player: string
): Promise<RegionTaxSummary[] | null> {
  try {
    const allData = await getCachedRegionDataSSR();
    const resourcePrices = await getCachedResourcePrices();
    const playerData = filterDeeds(allData, {
      filter_players: [player],
      filter_worksites: ["KEEP", "CASTLE"],
    });

    const result =
      playerData.length > 0
        ? processPlayerTaxIncome(playerData, allData, resourcePrices)
        : null;

    return result;
  } catch (err) {
    console.error("Failed to load player tax data", err);
    throw new Error(
      err instanceof Error ? err.message : "Failed to load player tax data"
    );
  }
}
