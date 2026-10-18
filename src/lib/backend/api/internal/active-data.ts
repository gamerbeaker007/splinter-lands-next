"use server";

// Client-callable reads of the shared cache. They never force a reload;
// refresh and invalidation stay server-side in active-data-cache.ts.
import * as cached from "./active-data-cache";

export async function getAllActiveData() {
  return cached.getAllActiveData();
}

export async function getLatestActiveEntry() {
  return cached.getLatestActiveEntry();
}
