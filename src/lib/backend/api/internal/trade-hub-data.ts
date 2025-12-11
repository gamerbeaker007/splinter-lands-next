"use server";
import { ResourceHubMetrics } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import logger from "../../log/logger.server";

// Global cache using globalThis (survives hot reloads)
// Properties are namespaced to avoid collisions with other caches
const cache = globalThis as unknown as {
  __tradeHubCache: ResourceHubMetrics[] | null;
  __tradeHubPromise: Promise<ResourceHubMetrics[]> | null;
};

cache.__tradeHubCache ??= null;
cache.__tradeHubPromise ??= null;

export async function getAllTradeHubData(
  forceWait: boolean = false
): Promise<ResourceHubMetrics[]> {
  // If forcing refresh, invalidate cache
  if (forceWait) {
    cache.__tradeHubCache = null;
  }

  // Return cached data if available
  if (cache.__tradeHubCache) {
    return cache.__tradeHubCache;
  }

  // Wait for existing fetch if in progress
  if (cache.__tradeHubPromise) {
    logger.info("⏳ Waiting for in-progress trade hub data fetch...");
    return cache.__tradeHubPromise;
  }

  // Fetch from database
  logger.info("🔄 Fetching trade hub data from database...");
  cache.__tradeHubPromise = prisma.resourceHubMetrics.findMany({
    orderBy: {
      date: "asc",
    },
  });

  cache.__tradeHubCache = await cache.__tradeHubPromise;
  cache.__tradeHubPromise = null;

  logger.info(`✅ Cached ${cache.__tradeHubCache.length} trade hub entries`);
  return cache.__tradeHubCache;
}

export async function getLatestTradeHubEntries(): Promise<
  ResourceHubMetrics[] | null
> {
  const all = await getAllTradeHubData();

  if (!all.length) return null;

  // Get the last date (from sorted ascending)
  const latestDate = all.at(-1)!.date;

  // Filter all entries with that date
  const latestEntries = all.filter(
    (entry) => entry.date.getTime() === latestDate.getTime()
  );

  return latestEntries;
}

export async function invalidateTradeHubDataCache(): Promise<void> {
  logger.info("🗑️ Invalidating trade hub data cache");
  cache.__tradeHubCache = null;
  cache.__tradeHubPromise = null;
}
