import { getLastUpdate } from "@/lib/cache/utils";
import { prisma } from "@/lib/prisma";
import { DeedComplete } from "@/types/deed";
import { FilterInput } from "@/types/filters";
import { filterDeeds } from "@/lib/filters";

let cachedDeedData: DeedComplete[] | null = null;
let cachedDeedTimestamp: Date | null = null;
let refreshPromise: Promise<void> | null = null;

async function getAllDeedData(): Promise<DeedComplete[]> {
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

async function getCachedDeedData(): Promise<DeedComplete[]> {
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

export async function getWorksiteTypeCountsFromBlob(filters: FilterInput) {
  const blob = await getCachedDeedData();
  const filteredDeeds = filterDeeds(blob, filters);

  const counts: Record<string, number> = {};
  for (const deed of filteredDeeds) {
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

export async function getActiveDeedCountByRegion(filters: FilterInput) {
  const blob = await getCachedDeedData();

  //Only the region filter will have effect unless one region is selected
  const regionFilter = filters.filter_regions ?? [];

  // If exactly one region is selected, fall back to counting by tract
  const countByTract = regionFilter.length === 1;

  const filteredDeeds = filterDeeds(blob, { filter_regions: regionFilter });

  const counts: Record<string, number> = {};
  for (const deed of filteredDeeds) {
    const groupKey = countByTract
      ? deed.tract_number // Use tract instead of region
      : deed.region_uid;

    const totalHarvest = deed.stakingDetail?.total_harvest_pp ?? 0;

    if (groupKey && totalHarvest > 0) {
      counts[groupKey] = (counts[groupKey] ?? 0) + 1;
    }
  }

  // Sort the entries by count descending
  const sortedCounts = Object.fromEntries(
    Object.entries(counts).sort(([, a], [, b]) => b - a),
  );

  return sortedCounts;
}

export async function getAvailableFilterValues(): Promise<
  Omit<
    FilterInput,
    "filter_developed" | "filter_under_construction" | "filter_has_pp"
  >
> {
  const blob = await getCachedDeedData();

  const values = {
    filter_regions: new Set<number>(),
    filter_tracts: new Set<number>(),
    filter_plots: new Set<number>(),
    filter_rarity: new Set<string>(),
    filter_resources: new Set<string>(),
    filter_worksites: new Set<string>(),
    filter_deed_type: new Set<string>(),
    filter_plot_status: new Set<string>(),
    filter_players: new Set<string>(),
  };

  for (const deed of blob) {
    if (deed.region_number) values.filter_regions.add(deed.region_number);
    if (deed.tract_number != null) values.filter_tracts.add(deed.tract_number);
    if (deed.plot_number != null) values.filter_plots.add(deed.plot_number);
    if (deed.rarity != null) values.filter_rarity.add(deed.rarity);
    if (deed.worksiteDetail?.token_symbol)
      values.filter_resources.add(deed.worksiteDetail.token_symbol);
    if (deed.worksite_type) values.filter_worksites.add(deed.worksite_type);
    if (deed.deed_type) values.filter_deed_type.add(deed.deed_type);
    if (deed.plot_status) values.filter_plot_status.add(deed.plot_status);
    if (deed.player) values.filter_players.add(deed.player);
  }

  return {
    filter_regions: [...values.filter_regions].sort((a, b) => a - b),
    filter_tracts: [...values.filter_tracts].sort((a, b) => a - b),
    filter_plots: [...values.filter_plots].sort((a, b) => a - b),
    filter_rarity: [...values.filter_rarity].sort(),
    filter_resources: [...values.filter_resources].sort(),
    filter_worksites: [...values.filter_worksites].sort(),
    filter_deed_type: [...values.filter_deed_type].sort(),
    filter_plot_status: [...values.filter_plot_status].sort(),
    filter_players: [...values.filter_players].sort(),
  };
}
