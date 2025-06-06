import { Deed, StakingDetail, WorksiteDetail } from "@/generated/prisma";
import { getLastUpdate } from "@/lib/cache/utils";
import { prisma } from "@/lib/prisma";

let cachedDeedData:
  | (Deed & {
      worksiteDetail: WorksiteDetail | null;
      stakingDetail: StakingDetail | null;
    })[]
  | null = null;
let cachedDeedTimestamp: Date | null = null;
let refreshPromise: Promise<void> | null = null;

async function getAllDeedData(): Promise<
  (Deed & {
    worksiteDetail: WorksiteDetail | null;
    stakingDetail: StakingDetail | null;
  })[]
> {
  console.log("getAllDeedData...");
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
      console.log("Refreshing deed data...");
      cachedDeedData = await getAllDeedData();
      cachedDeedTimestamp = lastUpdate;
      refreshPromise = null;
    })();
  }
  return refreshPromise;
}

async function triggerRefreshIfStale(): Promise<void> {
  const lastUpdate = await getLastUpdate();
  if (
    !cachedDeedData ||
    !cachedDeedTimestamp ||
    cachedDeedTimestamp < lastUpdate
  ) {
    void refreshDeedCache(); // Fire-and-forget
  }
}

async function getCachedDeedData(): Promise<
  (Deed & {
    worksiteDetail: WorksiteDetail | null;
    stakingDetail: StakingDetail | null;
  })[]
> {
  // Trigger background refresh, but don't wait for it
  triggerRefreshIfStale().catch(console.error);

  // Always return what we have immediately
  if (!cachedDeedData) {
    // If no cached data at all, block and fetch once
    console.log("No cache wait refreshDeedCache()...");
    await refreshDeedCache();
  }

  return cachedDeedData!;
}

export async function getWorksiteTypeCountsFromBlob() {
  const blob = await getCachedDeedData();
  const counts: Record<string, number> = {};
  for (const deed of blob) {
    const type = deed.worksite_type ?? "unknown";
    counts[type] = (counts[type] ?? 0) + 1;
  }
  // Order by keys in worksite_type_mapping
  const orderedCounts: Record<string, number> = {};
  const orderedKeys = [
    "Grain Farm",
    "Logging Camp",
    "Ore Mine",
    "Quarry",
    "Research Hut",
    "Aura Lab",
    "Shard Mine",
    "KEEP",
    "CASTLE",
    "",
  ];

  for (const key of orderedKeys) {
    if (counts[key]) {
      orderedCounts[key] = counts[key];
    }
  }

  return orderedCounts;
}

export async function getUniquePlayerCountFromBlob() {
  const blob = await getCachedDeedData();
  const uniquePlayers = new Set<string>();

  for (const deed of blob) {
    const player = deed.player ?? deed.player ?? null;
    if (player) {
      uniquePlayers.add(player);
    }
  }

  return uniquePlayers.size;
}

export async function getActiveDeedCountByRegion() {
  const blob = await getCachedDeedData();
  const counts: Record<string, number> = {};

  for (const deed of blob) {
    const region = deed.region_uid;
    const totalHarvest = deed.stakingDetail?.total_harvest_pp ?? 0;

    if (region && totalHarvest > 0) {
      counts[region] = (counts[region] ?? 0) + 1;
    }
  }

  // Sort the entries by count ascending
  const sortedCounts = Object.fromEntries(
    Object.entries(counts).sort(([, a], [, b]) => b - a),
  );

  return sortedCounts;
}
