"use server";

// Client-callable reads of the shared cache. They never force a reload;
// refresh and invalidation stay server-side in resource-tracking-data-cache.ts.
import * as cached from "./resource-tracking-data-cache";

export async function getAllResourceTrackingdata() {
  return cached.getAllResourceTrackingdata();
}

export async function getLatestResourceTrackingEntries() {
  return cached.getLatestResourceTrackingEntries();
}
