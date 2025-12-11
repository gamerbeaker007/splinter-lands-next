"use server";
import { PlayerProductionSummary } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import logger from "../../log/logger.server";

// Global cache using globalThis (survives hot reloads)
const cache = globalThis as unknown as {
  playerProductionData: PlayerProductionSummary[] | null;
  promise: Promise<PlayerProductionSummary[]> | null;
};

cache.playerProductionData ??= null;
cache.promise ??= null;

export async function getPlayerProductionData(
  forceWait: boolean = false
): Promise<PlayerProductionSummary[]> {
  // If forcing refresh, invalidate cache
  if (forceWait) {
    cache.playerProductionData = null;
  }

  // Return cached data if available
  if (cache.playerProductionData) {
    return cache.playerProductionData;
  }

  // Wait for existing fetch if in progress
  if (cache.promise) {
    logger.info("⏳ Waiting for in-progress player production data fetch...");
    return cache.promise;
  }

  // Fetch from database
  logger.info("🔄 Fetching player production data from database...");
  cache.promise = prisma.playerProductionSummary.findMany({});

  cache.playerProductionData = await cache.promise;
  cache.promise = null;

  logger.info(
    `✅ Cached ${cache.playerProductionData.length} player production entries`
  );
  return cache.playerProductionData;
}

export async function invalidatePlayerProductionDataCache(): Promise<void> {
  logger.info("🗑️ Invalidating player production data cache");
  cache.playerProductionData = null;
  cache.promise = null;
}
