"use server";
import { PlayerTradeHubPosition } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import logger from "../../log/logger.server";

// Global cache using globalThis (survives hot reloads)
const cache = globalThis as unknown as {
  playerTradeHubData: PlayerTradeHubPosition[] | null;
  promise: Promise<PlayerTradeHubPosition[]> | null;
  lastDate: Date | null;
};

cache.playerTradeHubData ??= null;
cache.promise ??= null;
cache.lastDate ??= null;

export async function getPlayerTradeHubPositionData(
  forceWait: boolean = false
): Promise<PlayerTradeHubPosition[]> {
  // If forcing refresh, invalidate cache
  if (forceWait) {
    cache.playerTradeHubData = null;
    cache.lastDate = null;
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
    cache.playerTradeHubData &&
    cache.lastDate &&
    latestDate &&
    cache.lastDate.getTime() === latestDate.getTime()
  ) {
    return cache.playerTradeHubData;
  }

  // Wait for existing fetch if in progress
  if (cache.promise) {
    logger.info(
      "⏳ Waiting for in-progress player trade hub position data fetch..."
    );
    return cache.promise;
  }

  // Fetch from database
  logger.info("🔄 Fetching player trade hub position data from database...");
  cache.promise = prisma.playerTradeHubPosition.findMany({});

  cache.playerTradeHubData = await cache.promise;
  cache.lastDate = latestDate;
  cache.promise = null;

  logger.info(
    `✅ Cached ${cache.playerTradeHubData.length} player trade hub position entries`
  );
  return cache.playerTradeHubData;
}

export async function invalidatePlayerTradeHubDataCache(): Promise<void> {
  logger.info("🗑️ Invalidating player trade hub position data cache");
  cache.playerTradeHubData = null;
  cache.promise = null;
  cache.lastDate = null;
}
