"use server";
import { Active } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import logger from "../../log/logger.server";

// Global cache using globalThis (survives hot reloads)
// Using namespaced properties to avoid collisions with other caches
const cache = globalThis as unknown as {
  __activeDataCache: Active[] | null;
  __activeDataPromise: Promise<Active[]> | null;
};

cache.__activeDataCache ??= null;
cache.__activeDataPromise ??= null;

export async function getAllActiveData(
  forceWait: boolean = false
): Promise<Active[]> {
  // If forcing refresh, invalidate cache
  if (forceWait) {
    cache.__activeDataCache = null;
  }

  // Return cached data if available
  if (cache.__activeDataCache) {
    return cache.__activeDataCache;
  }

  // Wait for existing fetch if in progress
  if (cache.__activeDataPromise) {
    logger.info("⏳ Waiting for in-progress active data fetch...");
    return cache.__activeDataPromise;
  }

  // Fetch from database
  logger.info("🔄 Fetching active data from database...");
  cache.__activeDataPromise = prisma.active.findMany({
    orderBy: {
      date: "asc",
    },
  });

  cache.__activeDataCache = await cache.__activeDataPromise;
  cache.__activeDataPromise = null;

  logger.info(`✅ Cached ${cache.__activeDataCache.length} active entries`);
  return cache.__activeDataCache;
}

export async function getLatestActiveEntry(): Promise<Active | null> {
  const all = await getAllActiveData();
  return all.at(-1) ?? null;
}

export async function invalidateActiveDataCache(): Promise<void> {
  logger.info("🗑️ Invalidating active data cache");
  cache.__activeDataCache = null;
  cache.__activeDataPromise = null;
}
