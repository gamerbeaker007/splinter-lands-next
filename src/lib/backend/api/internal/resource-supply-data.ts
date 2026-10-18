"use server";

// Client-callable reads of the shared cache. They never force a reload;
// refresh and invalidation stay server-side in resource-supply-data-cache.ts.
import * as cached from "./resource-supply-data-cache";

export async function getAllResourceSupplyData() {
  return cached.getAllResourceSupplyData();
}

export async function getLatestResourceSupplyEntries() {
  return cached.getLatestResourceSupplyEntries();
}
