"use server";
import { Active } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import logger from "../../log/logger.server";

// Global cache using globalThis (survives hot reloads)
const cache = globalThis as unknown as {
  activeData: Active[] | null;
  promise: Promise<Active[]> | null;
};

cache.activeData ??= null;
cache.promise ??= null;

export async function getAllActiveData(
  forceWait: boolean = false
): Promise<Active[]> {
  // If forcing refresh, invalidate cache
  if (forceWait) {
    cache.activeData = null;
  }

  // Return cached data if available
  if (cache.activeData) {
    return cache.activeData;
  }

  // Wait for existing fetch if in progress
  if (cache.promise) {
    logger.info("⏳ Waiting for in-progress active data fetch...");
    return cache.promise;
  }

  // Fetch from database
  logger.info("🔄 Fetching active data from database...");
  cache.promise = prisma.active.findMany({
    orderBy: {
      date: "asc",
    },
  });

  cache.activeData = await cache.promise;
  cache.promise = null;

  logger.info(`✅ Cached ${cache.activeData.length} active entries`);
  return cache.activeData;
}

export async function getLatestActiveEntry(): Promise<Active | null> {
  const all = await getAllActiveData();
  return all.at(-1) ?? null;
}

export async function invalidateActiveDataCache(): Promise<void> {
  logger.info("🗑️ Invalidating active data cache");
  cache.activeData = null;
  cache.promise = null;
}
