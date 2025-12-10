"use server";
import { ResourceTracking } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import logger from "../../log/logger.server";

// Global cache using globalThis (survives hot reloads)
const cache = globalThis as unknown as {
  resourceTrackingData: ResourceTracking[] | null;
  promise: Promise<ResourceTracking[]> | null;
};

cache.resourceTrackingData ??= null;
cache.promise ??= null;

export async function getAllResourceTrackingdata(
  forceWait: boolean = false
): Promise<ResourceTracking[]> {
  // If forcing refresh, invalidate cache
  if (forceWait) {
    cache.resourceTrackingData = null;
  }

  // Return cached data if available
  if (cache.resourceTrackingData) {
    return cache.resourceTrackingData;
  }

  // Wait for existing fetch if in progress
  if (cache.promise) {
    logger.info("⏳ Waiting for in-progress resource tracking data fetch...");
    return cache.promise;
  }

  // Fetch from database
  logger.info("🔄 Fetching resource tracking data from database...");
  cache.promise = prisma.resourceTracking.findMany({
    orderBy: {
      date: "asc",
    },
  });

  cache.resourceTrackingData = await cache.promise;
  cache.promise = null;

  logger.info(
    `✅ Cached ${cache.resourceTrackingData.length} resource tracking entries`
  );
  return cache.resourceTrackingData;
}

export async function getLatestResourceTrackingEntries(): Promise<
  ResourceTracking[] | null
> {
  const all = await getAllResourceTrackingdata();

  if (!all.length) return null;

  // Get the last date (from sorted ascending)
  const latestDate = all.at(-1)!.date;

  // Filter all entries with that date
  const latestEntries = all.filter(
    (entry) => entry.date.getTime() === latestDate.getTime()
  );

  return latestEntries;
}

export async function invalidateResourceTrackingDataCache(): Promise<void> {
  logger.info("🗑️ Invalidating resource tracking data cache");
  cache.resourceTrackingData = null;
  cache.promise = null;
}
