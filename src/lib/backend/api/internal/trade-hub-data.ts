"use server";

// Client-callable reads of the shared cache. They never force a reload;
// refresh and invalidation stay server-side in trade-hub-data-cache.ts.
import * as cached from "./trade-hub-data-cache";

export async function getAllTradeHubData() {
  return cached.getAllTradeHubData();
}

export async function getLatestTradeHubEntries() {
  return cached.getLatestTradeHubEntries();
}
