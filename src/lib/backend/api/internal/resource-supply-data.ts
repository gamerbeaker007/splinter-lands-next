"use server";
import { ResourceSupply } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import logger from "../../log/logger.server";

// Global cache using globalThis (survives hot reloads)
const cache = globalThis as unknown as {
  resourceSupplyData: ResourceSupply[] | null;
  promise: Promise<ResourceSupply[]> | null;
};

cache.resourceSupplyData ??= null;
cache.promise ??= null;

export async function getAllResourceSupplyData(
  forceWait: boolean = false
): Promise<ResourceSupply[]> {
  // If forcing refresh, invalidate cache
  if (forceWait) {
    cache.resourceSupplyData = null;
  }

  // Return cached data if available
  if (cache.resourceSupplyData) {
    return cache.resourceSupplyData;
  }

  // Wait for existing fetch if in progress
  if (cache.promise) {
    logger.info("⏳ Waiting for in-progress resource supply data fetch...");
    return cache.promise;
  }

  // Fetch from database
  logger.info("🔄 Fetching resource supply data from database...");
  cache.promise = prisma.resourceSupply.findMany({
    orderBy: {
      date: "asc",
    },
  });

  cache.resourceSupplyData = await cache.promise;
  cache.promise = null;

  logger.info(
    `✅ Cached ${cache.resourceSupplyData.length} resource supply entries`
  );
  return cache.resourceSupplyData;
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
  cache.resourceSupplyData = null;
  cache.promise = null;
}
