"use server";
import { ResourceSupply } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import logger from "../../log/logger.server";

// Global cache using globalThis (survives hot reloads)
// Properties are namespaced to avoid collisions with other caches
const cache = globalThis as unknown as {
  __resourceSupplyCache: ResourceSupply[] | null;
  __resourceSupplyPromise: Promise<ResourceSupply[]> | null;
};

cache.__resourceSupplyCache ??= null;
cache.__resourceSupplyPromise ??= null;

export async function getAllResourceSupplyData(
  forceWait: boolean = false
): Promise<ResourceSupply[]> {
  // If forcing refresh, invalidate cache
  if (forceWait) {
    cache.__resourceSupplyCache = null;
  }

  // Return cached data if available
  if (cache.__resourceSupplyCache) {
    return cache.__resourceSupplyCache;
  }

  // Wait for existing fetch if in progress
  if (cache.__resourceSupplyPromise) {
    logger.info("⏳ Waiting for in-progress resource supply data fetch...");
    return cache.__resourceSupplyPromise;
  }

  // Fetch from database
  logger.info("🔄 Fetching resource supply data from database...");
  cache.__resourceSupplyPromise = prisma.resourceSupply.findMany({
    orderBy: {
      date: "asc",
    },
  });

  cache.__resourceSupplyCache = await cache.__resourceSupplyPromise;
  cache.__resourceSupplyPromise = null;

  logger.info(
    `✅ Cached ${cache.__resourceSupplyCache.length} resource supply entries`
  );
  return cache.__resourceSupplyCache;
}

export async function getLatestResourceSupplyEntries(): Promise<
  ResourceSupply[] | null
> {
  const all = await getAllResourceSupplyData();

  if (!all.length) return null;

  // Get the last date (from sorted ascending)
  const latestDate = all.at(-1)!.date;

  // Filter all entries with that date
  const latestEntries = all.filter(
    (entry) => entry.date.getTime() === latestDate.getTime()
  );

  return latestEntries;
}

export async function invalidateResourceSupplyDataCache(): Promise<void> {
  logger.info("🗑️ Invalidating resource supply data cache");
  cache.__resourceSupplyCache = null;
  cache.__resourceSupplyPromise = null;
}
