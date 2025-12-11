"use server";
import { ResourceHubMetrics } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import logger from "../../log/logger.server";

// Global cache using globalThis (survives hot reloads)
const cache = globalThis as unknown as {
  tradeHubData: ResourceHubMetrics[] | null;
  promise: Promise<ResourceHubMetrics[]> | null;
};

cache.tradeHubData ??= null;
cache.promise ??= null;

export async function getAllTradeHubData(
  forceWait: boolean = false
): Promise<ResourceHubMetrics[]> {
  // If forcing refresh, invalidate cache
  if (forceWait) {
    cache.tradeHubData = null;
  }

  // Return cached data if available
  if (cache.tradeHubData) {
    return cache.tradeHubData;
  }

  // Wait for existing fetch if in progress
  if (cache.promise) {
    logger.info("⏳ Waiting for in-progress trade hub data fetch...");
    return cache.promise;
  }

  // Fetch from database
  logger.info("🔄 Fetching trade hub data from database...");
  cache.promise = prisma.resourceHubMetrics.findMany({
    orderBy: {
      date: "asc",
    },
  });

  cache.tradeHubData = await cache.promise;
  cache.promise = null;

  logger.info(`✅ Cached ${cache.tradeHubData.length} trade hub entries`);
  return cache.tradeHubData;
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
  cache.tradeHubData = null;
  cache.promise = null;
}
