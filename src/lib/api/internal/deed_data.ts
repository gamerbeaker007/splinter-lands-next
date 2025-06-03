import { Deed } from "@/generated/prisma";
import { getLastUpdate } from "@/lib/cache/utils";
import { prisma } from "@/lib/prisma";

let cachedDeedData: Deed[] | null = null;
let cachedDeedTimestamp: Date | null = null;

export async function getAllDeedData(): Promise<Deed[]> {
  return prisma.deed.findMany({
    include: {
      worksiteDetail: true,
      stakingDetail: true,
    },
  });
}

export async function getCachedDeedData(): Promise<Deed[]> {
  const lastUpdate = await getLastUpdate();
  if (
    !cachedDeedData ||
    !cachedDeedTimestamp ||
    cachedDeedTimestamp < lastUpdate
  ) {
    console.log("Refreshing deed data...");
    cachedDeedData = await getAllDeedData();
    cachedDeedTimestamp = lastUpdate;
  }
  return cachedDeedData;
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
