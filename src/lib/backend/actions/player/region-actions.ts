"use server";

import { getCachedRegionDataSSR } from "@/lib/backend/api/internal/deed-data";
import { getPlayerData } from "@/lib/backend/api/internal/player-data";
import {
  processPlayerRegionInformation,
  processPlayerTaxIncome,
} from "@/lib/backend/services/playerService";
import { getCachedResourcePrices } from "@/lib/backend/services/resourceService";
import { filterDeeds } from "@/lib/filters";
import { FilterInput } from "@/types/filters";
import { PlayerRegionDataType, RegionTaxSummary } from "@/types/resource";

/**
 * Get player region overview data
 */
export async function getPlayerRegionData(
  player: string,
  filters: FilterInput,
  force: boolean = false
): Promise<PlayerRegionDataType> {
  try {
    const playerData = await getPlayerData(player, filters, force);

    if (!playerData) {
      throw new Error("No data found");
    }

    const result = await processPlayerRegionInformation(playerData);
    return result;
  } catch (err) {
    console.error("Failed to load player region data", err);
    throw new Error(
      err instanceof Error ? err.message : "Failed to load player region data"
    );
  }
}

/**
 * Get player tax income data
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
