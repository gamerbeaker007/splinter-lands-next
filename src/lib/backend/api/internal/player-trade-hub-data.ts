"use server";
import { PlayerTradeHubPosition } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import logger from "../../log/logger.server";

// Global cache using globalThis (survives hot reloads)
// Properties are namespaced to avoid collisions with other caches
const cache = globalThis as unknown as {
  __playerTradeHubCache: PlayerTradeHubPosition[] | null;
  __playerTradeHubPromise: Promise<PlayerTradeHubPosition[]> | null;
  __playerTradeHubLastDate: Date | null;
};

cache.__playerTradeHubCache ??= null;
cache.__playerTradeHubPromise ??= null;
cache.__playerTradeHubLastDate ??= null;

export async function getPlayerTradeHubPositionData(
  forceWait: boolean = false
): Promise<PlayerTradeHubPosition[]> {
  // If forcing refresh, invalidate cache
  if (forceWait) {
    cache.__playerTradeHubCache = null;
    cache.__playerTradeHubLastDate = null;
  }

  // Check for new data in database
  const latestRow = await prisma.playerTradeHubPosition.findFirst({
    orderBy: { date: "desc" },
    select: { date: true },
  });

  const latestDate = latestRow?.date ?? null;

  if (!latestRow) {
    logger.warn("No PlayerTradeHubPosition data found.");
    return [];
  }

  // Return cached data if it's up to date
  if (
    cache.__playerTradeHubCache &&
    cache.__playerTradeHubLastDate &&
    latestDate &&
    cache.__playerTradeHubLastDate.getTime() === latestDate.getTime()
  ) {
    return cache.__playerTradeHubCache;
  }

  // Wait for existing fetch if in progress
  if (cache.__playerTradeHubPromise) {
    logger.info(
      "⏳ Waiting for in-progress player trade hub position data fetch..."
    );
    return cache.__playerTradeHubPromise;
  }

  // Fetch from database
  logger.info("🔄 Fetching player trade hub position data from database...");
  cache.__playerTradeHubPromise = prisma.playerTradeHubPosition.findMany({});

  cache.__playerTradeHubCache = await cache.__playerTradeHubPromise;
  cache.__playerTradeHubLastDate = latestDate;
  cache.__playerTradeHubPromise = null;

  logger.info(
    `✅ Cached ${cache.__playerTradeHubCache.length} player trade hub position entries`
  );
  return cache.__playerTradeHubCache;
}

export async function invalidatePlayerTradeHubDataCache(): Promise<void> {
  logger.info("🗑️ Invalidating player trade hub position data cache");
  cache.__playerTradeHubCache = null;
  cache.__playerTradeHubPromise = null;
  cache.__playerTradeHubLastDate = null;
}
