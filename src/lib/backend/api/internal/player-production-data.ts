"use server";
import { PlayerProductionSummary } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import logger from "../../log/logger.server";

// Global cache using globalThis (survives hot reloads)
// Properties are namespaced to avoid collisions with other caches
const cache = globalThis as unknown as {
  __playerProductionCache: PlayerProductionSummary[] | null;
  __playerProductionPromise: Promise<PlayerProductionSummary[]> | null;
};

cache.__playerProductionCache ??= null;
cache.__playerProductionPromise ??= null;

export async function getPlayerProductionData(
  forceWait: boolean = false
): Promise<PlayerProductionSummary[]> {
  // If forcing refresh, invalidate cache
  if (forceWait) {
    cache.__playerProductionCache = null;
  }

  // Return cached data if available
  if (cache.__playerProductionCache) {
    return cache.__playerProductionCache;
  }

  // Wait for existing fetch if in progress
  if (cache.__playerProductionPromise) {
    logger.info("⏳ Waiting for in-progress player production data fetch...");
    return cache.__playerProductionPromise;
  }

  // Fetch from database
  logger.info("🔄 Fetching player production data from database...");
  cache.__playerProductionPromise = prisma.playerProductionSummary.findMany({});

  cache.__playerProductionCache = await cache.__playerProductionPromise;
  cache.__playerProductionPromise = null;

  logger.info(
    `✅ Cached ${cache.__playerProductionCache.length} player production entries`
  );
  return cache.__playerProductionCache;
}

export async function invalidatePlayerProductionDataCache(): Promise<void> {
  logger.info("🗑️ Invalidating player production data cache");
  cache.__playerProductionCache = null;
  cache.__playerProductionPromise = null;
}
