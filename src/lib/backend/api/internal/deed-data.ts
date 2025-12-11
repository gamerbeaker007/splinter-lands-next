"use server";
import { prisma } from "@/lib/prisma";
import { DeedComplete } from "@/types/deed";
import logger from "../../log/logger.server";

// Global cache using globalThis (survives hot reloads)
const cache = globalThis as unknown as {
  deeds: DeedComplete[] | null;
  promise: Promise<DeedComplete[]> | null;
};

cache.deeds ??= null;
cache.promise ??= null;

export async function getCachedRegionDataSSR(
  forceWait: boolean = false
): Promise<DeedComplete[]> {
  // If forcing refresh, invalidate cache
  if (forceWait) {
    cache.deeds = null;
  }

  // Return cached data if available
  if (cache.deeds) {
    return cache.deeds;
  }

  // Wait for existing fetch if in progress
  if (cache.promise) {
    logger.info("⏳ Waiting for in-progress fetch...");
    return cache.promise;
  }

  // Fetch from database
  logger.info("🔄 Fetching deeds from database...");
  cache.promise = prisma.deed.findMany({
    include: {
      worksiteDetail: true,
      stakingDetail: true,
    },
  });

  cache.deeds = await cache.promise;
  cache.promise = null;

  logger.info(`✅ Cached ${cache.deeds.length} deeds`);
  return cache.deeds;
}

export async function invalidateDeedCache(): Promise<void> {
  logger.info("🗑️ Invalidating deed cache");
  cache.deeds = null;
  cache.promise = null;
}
