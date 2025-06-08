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
  console.log("Start filter");
  console.time("Filtering");
  const filteredDeeds = filterDeeds(blob, filters);
  console.timeEnd("Filtering");

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

export async function getAvailableFilterValues(): Promise<
  Omit<
    FilterInput,
    "filter_developed" | "filter_under_construction" | "filter_has_pp"
  >
> {
  const blob = await getCachedDeedData();

  const values = {
    filter_regions: new Set<string>(),
    filter_tracts: new Set<string>(),
    filter_plots: new Set<string>(),
    filter_rarity: new Set<string>(),
    filter_resources: new Set<string>(),
    filter_worksites: new Set<string>(),
    filter_deed_type: new Set<string>(),
    filter_plot_status: new Set<string>(),
    filter_players: new Set<string>(),
  };

  for (const deed of blob) {
    if (deed.region_uid) values.filter_regions.add(deed.region_uid);
    if (deed.tract_number != null)
      values.filter_tracts.add(deed.tract_number.toString());
    if (deed.plot_number != null)
      values.filter_plots.add(deed.plot_number.toString());
    if (deed.rarity != null) values.filter_rarity.add(deed.rarity.toString());
    if (deed.worksiteDetail?.token_symbol)
      values.filter_resources.add(deed.worksiteDetail.token_symbol.toString());
    if (deed.worksite_type) values.filter_worksites.add(deed.worksite_type);
    if (deed.deed_type) values.filter_deed_type.add(deed.deed_type);
    if (deed.plot_status) values.filter_plot_status.add(deed.plot_status);
    if (deed.player) values.filter_players.add(deed.player);
  }

  return {
    filter_regions: [...values.filter_regions],
    filter_tracts: [...values.filter_tracts],
    filter_plots: [...values.filter_plots],
    filter_rarity: [...values.filter_rarity],
    filter_resources: [...values.filter_resources],
    filter_worksites: [...values.filter_worksites],
    filter_deed_type: [...values.filter_deed_type],
    filter_plot_status: [...values.filter_plot_status],
    filter_players: [...values.filter_players],
  };
}
