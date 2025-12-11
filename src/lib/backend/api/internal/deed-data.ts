"use server";
import { prisma } from "@/lib/prisma";
import { DeedComplete } from "@/types/deed";
import logger from "../../log/logger.server";

// Global cache using globalThis (survives hot reloads)
// Using namespaced properties to avoid collisions with other caches
const cache = globalThis as unknown as {
  __deedsCache: DeedComplete[] | null;
  __deedsPromise: Promise<DeedComplete[]> | null;
};

cache.__deedsCache ??= null;
cache.__deedsPromise ??= null;

export async function getCachedRegionDataSSR(
  forceWait: boolean = false
): Promise<DeedComplete[]> {
  // If forcing refresh, invalidate cache
  if (forceWait) {
    cache.__deedsCache = null;
  }

  // Return cached data if available
  if (cache.__deedsCache) {
    return cache.__deedsCache;
  }

  // Wait for existing fetch if in progress
  if (cache.__deedsPromise) {
    logger.info("⏳ Waiting for in-progress fetch...");
    return cache.__deedsPromise;
  }

  // Fetch from database
  logger.info("🔄 Fetching deeds from database...");
  cache.__deedsPromise = prisma.deed.findMany({
    include: {
      worksiteDetail: true,
      stakingDetail: true,
    },
  });

  cache.__deedsCache = await cache.__deedsPromise;
  cache.__deedsPromise = null;

  logger.info(`✅ Cached ${cache.__deedsCache.length} deeds`);
  return cache.__deedsCache;
}

export async function invalidateDeedCache(): Promise<void> {
  logger.info("🗑️ Invalidating deed cache");
  cache.__deedsCache = null;
  cache.__deedsPromise = null;
}
