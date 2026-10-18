"use server";

// Client-callable reads of the shared cache. They never force a reload;
// refresh and invalidation stay server-side in deed-data-cache.ts.
import * as cached from "./deed-data-cache";

export async function getCachedRegionDataSSR() {
  return cached.getCachedRegionDataSSR();
}
