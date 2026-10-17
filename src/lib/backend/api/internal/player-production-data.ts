"use server";

// Client-callable reads of the shared cache. They never force a reload;
// refresh and invalidation stay server-side in player-production-data-cache.ts.
import * as cached from "./player-production-data-cache";

export async function getPlayerProductionData() {
  return cached.getPlayerProductionData();
}
