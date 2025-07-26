import { FilterInput } from "@/types/filters";
import { RegionSummary } from "@/types/regionSummary";
import { getCachedRegionData } from "../api/internal/deed-data";
import { filterDeeds } from "../../filters";
import { DeedComplete } from "@/types/deed";
import { ProgressInfo } from "@/types/progressInfo";
import { getProgressInfo } from "@/lib/backend/helpers/productionUtils";
import { DeedAlertsInfo } from "@/types/deedAlertsInfo";

export function summarizeDeedsData(deeds: DeedComplete[]): RegionSummary {
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
  const seenPairs = new Set<string>();
  let runiCount = 0;
  let totalDecNeeded = 0;
  let totalDecInUse = 0;
  let totalDecStaked = 0;
  let totalDeeds = 0;
  let totalRawPP = 0;
  let totalBoostedPP = 0;

  for (const deed of deeds) {
    const player = deed.player!;
    const regionUid = deed.region_uid!;
    const key = `${regionUid}-${player}`;

    totalDeeds += 1;

    const worksite = deed.worksite_type ?? "unknown";
    worksiteCounts[worksite] = (worksiteCounts[worksite] ?? 0) + 1;

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
      runiCount += runiBoost > 0 ? 1 : 0;

      const totemBoost = staking.totem_boost ?? 0;
      totemBoostCounts[totemBoost] = (totemBoostCounts[totemBoost] ?? 0) + 1;

      const titleBoost = staking.title_boost ?? 0;
      titleBoostCounts[titleBoost] = (titleBoostCounts[titleBoost] ?? 0) + 1;

      const rarityBoost = staking.deed_rarity_boost ?? 0;
      deedRarityBoostCounts[rarityBoost] =
        (deedRarityBoostCounts[rarityBoost] ?? 0) + 1;

      totalDecNeeded += staking.total_dec_stake_needed ?? 0;
      totalDecInUse += staking.total_dec_stake_in_use ?? 0;

      totalRawPP += staking.total_base_pp_after_cap ?? 0;
      totalBoostedPP += staking.total_harvest_pp ?? 0;

      //staked DEC is based on region only add it one per region-player combination
      totalDecStaked += !seenPairs.has(key)
        ? (staking.total_dec_staked ?? 0)
        : 0;
      seenPairs.add(key);
    }
  }

  return {
    worksites: worksiteCounts,
    players: playerCounts,
    rarities: rarityCounts,
    deedTypes: deedTypeCounts,
    plotStatuses: plotStatusCounts,
    runiCount: runiCount,
    runiBoosts: runiBoostCounts,
    totemBoosts: totemBoostCounts,
    titleBoosts: titleBoostCounts,
    deedRarityBoosts: deedRarityBoostCounts,
    totalDecNeeded: totalDecNeeded,
    totalDecInUse: totalDecInUse,
    totalDecStaked: totalDecStaked,
    deedsCount: totalDeeds,
    totalBasePP: totalRawPP,
    totalBoostedPP: totalBoostedPP,
  };
}

export async function getRegionSummary(
  filters: FilterInput,
): Promise<RegionSummary> {
  const blob = await getCachedRegionData();
  const filteredDeeds = filterDeeds(blob, filters);

  return summarizeDeedsData(filteredDeeds);
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
  const filteredDeeds = filterDeeds(blob, filters);

  const countByTract = filters.filter_regions?.length === 1;

  const result: Record<string, { active: number; inactive: number }> = {};

  for (const deed of filteredDeeds) {
    const groupKey = countByTract ? deed.tract_number! : deed.region_uid!;
    const totalHarvest = deed.stakingDetail?.total_harvest_pp ?? 0;

    if (!result[groupKey]) {
      result[groupKey] = { active: 0, inactive: 0 };
    }

    if (totalHarvest > 0) {
      result[groupKey].active += 1;
    } else {
      result[groupKey].inactive += 1;
    }
  }

  // Sort by active count descending
  return Object.fromEntries(
    Object.entries(result).sort(([, a], [, b]) => b.active - a.active),
  );
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

export function enrichWithProgressInfo(deeds: DeedComplete[]): DeedComplete[] {
  return deeds.map((deed) => {
    const isTaxSymbol = deed.worksiteDetail?.token_symbol === "TAX";
    const progressInfo: ProgressInfo = isTaxSymbol
      ? {
          percentageDone: 0,
          infoStr: "N/A",
          progressTooltip:
            "The status of Keeps and Castles remains a mystery for now.",
        }
      : getProgressInfo(
          deed.worksiteDetail?.hours_since_last_op ?? 0,
          deed.worksiteDetail?.project_created_date ?? null,
          deed.worksiteDetail?.projected_end ?? null,
          deed.stakingDetail?.total_harvest_pp ?? 0,
        );

    return {
      ...deed,
      progressInfo,
    };
  });
}

export function getDeedsAlerts(deeds: DeedComplete[]): DeedAlertsInfo[] {
  return deeds
    .filter(
      (deed) =>
        deed.progressInfo !== undefined &&
        deed.progressInfo !== null &&
        deed.progressInfo.percentageDone >= 100,
    )
    .map((deed) => {
      return {
        regionUid: deed.region_uid!,
        regionNumber: deed.region_number!,
        plotNumber: deed.plot_number!,
        plotId: deed.plot_id!,
        tractNumber: deed.tract_number!,
        percentageDone: deed.progressInfo!.percentageDone,
        infoStr: deed.progressInfo!.infoStr,

        deedType: deed.deed_type!,
        rarity: deed.rarity!,
        magicType: deed.magic_type!,
        worksiteType: deed.worksiteDetail!.worksite_type!,
        plotStatus: deed.plot_status!,
      } as DeedAlertsInfo;
    });
}
