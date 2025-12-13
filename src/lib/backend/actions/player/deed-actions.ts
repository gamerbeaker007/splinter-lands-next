"use server";

import { RawRegionDataResponse } from "@/types/RawRegionDataResponse";
import { getCachedPlayerData } from "../../services/playerService";

/**
 * Get player land deeds with caching.
 * Uses hourly cache since player deeds can change.
 */
export async function getPlayerDeeds(
  player: string
): Promise<RawRegionDataResponse> {
  return await getCachedPlayerData(player);
}
