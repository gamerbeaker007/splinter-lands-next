import { getLastUpdate } from "@/lib/backend/cache/utils";
import { logger } from "@/lib/backend/log/logger";
import { prisma } from "@/lib/prisma";
import { DeedComplete } from "@/types/deed";

let cachedDeedData: DeedComplete[] | null = null;
let cachedDeedTimestamp: Date | null = null;
let refreshPromise: Promise<void> | null = null;

async function getAllDeedData(): Promise<DeedComplete[]> {
  logger.info("getAllDeedData...");
  return prisma.deed.findMany({
    include: {
      worksiteDetail: true,
      stakingDetail: true,
    },
  });
}

async function refreshDeedCache(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const lastUpdate = await getLastUpdate();
      logger.info("Refreshing deed data...");
      cachedDeedData = await getAllDeedData();
      cachedDeedTimestamp = lastUpdate;
      refreshPromise = null;
    })();
  }
  return refreshPromise;
}

async function triggerRefreshIfStale(
  forceWait: boolean = false,
): Promise<boolean> {
  const lastUpdate = await getLastUpdate();

  const needsRefresh =
    !cachedDeedData || !cachedDeedTimestamp || cachedDeedTimestamp < lastUpdate;

  if (needsRefresh) {
    if (forceWait) {
      await refreshDeedCache();
    } else {
      void refreshDeedCache(); // Fire-and-forget
    }
  }

  return needsRefresh;
}

export async function getCachedRegionData(
  forceWait: boolean = false,
): Promise<DeedComplete[]> {
  await triggerRefreshIfStale(forceWait);

  if (!cachedDeedData) {
    logger.info("No cache yet – forcing wait for refresh...");
    await refreshDeedCache();
  }

  return cachedDeedData!;
}
