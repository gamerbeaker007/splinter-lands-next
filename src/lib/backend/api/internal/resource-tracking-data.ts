"use server";
import { ResourceTracking } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import logger from "../../log/logger.server";

// Global cache using globalThis (survives hot reloads)
// Properties are namespaced to avoid collisions with other caches
const cache = globalThis as unknown as {
  __resourceTrackingCache: ResourceTracking[] | null;
  __resourceTrackingPromise: Promise<ResourceTracking[]> | null;
};

cache.__resourceTrackingCache ??= null;
cache.__resourceTrackingPromise ??= null;

export async function getAllResourceTrackingdata(
  forceWait: boolean = false
): Promise<ResourceTracking[]> {
  // If forcing refresh, invalidate cache
  if (forceWait) {
    cache.__resourceTrackingCache = null;
  }

  // Return cached data if available
  if (cache.__resourceTrackingCache) {
    return cache.__resourceTrackingCache;
  }

  // Wait for existing fetch if in progress
  if (cache.__resourceTrackingPromise) {
    logger.info("⏳ Waiting for in-progress resource tracking data fetch...");
    return cache.__resourceTrackingPromise;
  }

  // Fetch from database
  logger.info("🔄 Fetching resource tracking data from database...");
  cache.__resourceTrackingPromise = prisma.resourceTracking.findMany({
    orderBy: {
      date: "asc",
    },
  });

  cache.__resourceTrackingCache = await cache.__resourceTrackingPromise;
  cache.__resourceTrackingPromise = null;

  logger.info(
    `✅ Cached ${cache.__resourceTrackingCache.length} resource tracking entries`
  );
  return cache.__resourceTrackingCache;
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
  cache.__resourceTrackingCache = null;
  cache.__resourceTrackingPromise = null;
}
