import { FilterInput } from "@/types/filters";
import { RegionSummary } from "@/types/regionSummary";
import { getCachedRegionData } from "../api/internal/deed-data";
import { filterDeeds } from "../filters";

export async function getRegionSummary(
  filters: FilterInput,
): Promise<RegionSummary> {
  const blob = await getCachedRegionData();
  const filteredDeeds = filterDeeds(blob, filters);

  // Initialize all count buckets
  const worksiteCounts: Record<string, number> = {};
  const playerCounts: Record<string, number> = {};
  const rarityCounts: Record<string, number> = {};
  const deedTypeCounts: Record<string, number> = {};
  const plotStatusCounts: Record<string, number> = {};
  const runiBoostCounts: Record<string, number> = {};
  const totemBoostCounts: Record<string, number> = {};
  const titleBoostCounts: Record<string, number> = {};
  const deedRarityBoostCounts: Record<string, number> = {};

  for (const deed of filteredDeeds) {
    const worksite = deed.worksite_type ?? "unknown";
    worksiteCounts[worksite] = (worksiteCounts[worksite] ?? 0) + 1;

    const player = deed.player ?? "unknown";
    playerCounts[player] = (playerCounts[player] ?? 0) + 1;

    const rarity = deed.rarity ?? "unknown";
    rarityCounts[rarity] = (rarityCounts[rarity] ?? 0) + 1;

    const deedType = deed.deed_type ?? "unknown";
    deedTypeCounts[deedType] = (deedTypeCounts[deedType] ?? 0) + 1;

    const plotStatus = deed.plot_status ?? "unknown";
    plotStatusCounts[plotStatus] = (plotStatusCounts[plotStatus] ?? 0) + 1;

    const staking = deed.stakingDetail;
    if (staking) {
      const runiBoost = staking.runi_boost ?? 0;
      runiBoostCounts[runiBoost] = (runiBoostCounts[runiBoost] ?? 0) + 1;

      const totemBoost = staking.totem_boost ?? 0;
      totemBoostCounts[totemBoost] = (totemBoostCounts[totemBoost] ?? 0) + 1;

      const titleBoost = staking.title_boost ?? 0;
      titleBoostCounts[titleBoost] = (titleBoostCounts[titleBoost] ?? 0) + 1;

      const rarityBoost = staking.deed_rarity_boost ?? 0;
      deedRarityBoostCounts[rarityBoost] =
        (deedRarityBoostCounts[rarityBoost] ?? 0) + 1;
    }
  }

  return {
    worksites: worksiteCounts,
    players: playerCounts,
    rarities: rarityCounts,
    deedTypes: deedTypeCounts,
    plotStatuses: plotStatusCounts,
    runiBoosts: runiBoostCounts,
    totemBoosts: totemBoostCounts,
    titleBoosts: titleBoostCounts,
    deedRarityBoosts: deedRarityBoostCounts,
  };
}

export async function getUniquePlayerCountFromBlob(forceWait: boolean = false) {
  const blob = await getCachedRegionData(forceWait);

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
  const blob = await getCachedRegionData();

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

export async function getAvailableFilterValues(
  player: string | null,
): Promise<FilterInput> {
  let blob = await getCachedRegionData();
  if (player) {
    blob = filterDeeds(blob, { filter_players: [player] });
  }

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
