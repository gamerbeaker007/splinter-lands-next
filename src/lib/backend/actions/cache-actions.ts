"use server";

import { getLastUpdate } from "@/lib/backend/cache/utils";
import { getUniquePlayerCountFromBlob } from "@/lib/backend/services/regionService";

/**
 * Get cache status.
 */
export async function getCacheStatus() {
  const [uniquePlayers, lastUpdate] = await Promise.all([
    getUniquePlayerCountFromBlob(),
    getLastUpdate(),
  ]);

  return {
    status: "ok",
    uniquePlayers,
    lastUpdate,
  };
}
