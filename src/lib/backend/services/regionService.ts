import { TAX_RATE } from "@/lib/shared/statics";
import { DeedComplete } from "@/types/deed";
import { FilterInput } from "@/types/filters";
import {
  titleModifiers,
  TitleTier,
  totemModifiers,
  TotemTier,
} from "@/types/planner";
import { Prices } from "@/types/price";
import { RegionSummary } from "@/types/regionSummary";
import { RegionTax } from "@/types/regionTax";
import { filterDeeds, parseLandStatsResources } from "../../filters";
import { getCachedRegionDataSSR } from "../api/internal/deed-data";
import {
  enrichWithProductionInfo as enrichWithProductionInfoShared,
  enrichWithProgressInfo as enrichWithProgressInfoShared,
  summarizeDeedsData,
} from "@/lib/shared/deedEnrichment";
import { SplTaxes } from "@/types/splTaxes";
import { fetchTaxes } from "../api/spl/spl-land-api";
import { cache } from "../cache/cache";

/**
 * Taxes of a TAX deed, shared by every visitor of the region / tract views
 * (any player's deeds), so it stays server-cached (1 h default TTL).
 */
async function getCachedTaxes(deedUid: string): Promise<SplTaxes> {
  const key = `taxes:${deedUid}`;
  const cached = cache.get<SplTaxes>(key);
  if (cached) return cached;
  const taxes = await fetchTaxes(deedUid);
  cache.set(key, taxes);
  return taxes;
}

export async function getRegionSummary(
  filters: FilterInput
): Promise<RegionSummary> {
  const blob = await getCachedRegionDataSSR();
  const filteredDeeds = filterDeeds(blob, filters);

  return summarizeDeedsData(filteredDeeds);
}

export async function getUniquePlayerCountFromBlob() {
  const blob = await getCachedRegionDataSSR();

  const uniquePlayers = new Set<string>();

  for (const deed of blob) {
    const player = deed.player ?? deed.player ?? null;
    if (player) {
      uniquePlayers.add(player);
    }
  }

  return uniquePlayers.size;
}

export async function getActiveDeedCountByRegion(
  filters: FilterInput
): Promise<Record<string, { active: number; inactive: number }>> {
  const blob = await getCachedRegionDataSSR();
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
    Object.entries(result).sort(([, a], [, b]) => b.active - a.active)
  );
}

export async function getAvailableFilterValues(
  player: string | null
): Promise<FilterInput> {
  const BOOST_EPSILON = 1e-9;
  const titleTierOrder: Exclude<TitleTier, "none">[] = [
    "rare",
    "epic",
    "legendary",
  ];
  const totemTierOrder: Exclude<TotemTier, "none">[] = [
    "common",
    "rare",
    "epic",
    "legendary",
  ];

  const titleTierForBoost = (
    boost: number
  ): Exclude<TitleTier, "none"> | null => {
    for (const tier of titleTierOrder) {
      if (Math.abs(boost - titleModifiers[tier]) <= BOOST_EPSILON) return tier;
    }
    return null;
  };

  const totemTierForBoost = (
    boost: number
  ): Exclude<TotemTier, "none"> | null => {
    for (const tier of totemTierOrder) {
      if (Math.abs(boost - totemModifiers[tier]) <= BOOST_EPSILON) return tier;
    }
    return null;
  };

  let blob = await getCachedRegionDataSSR();
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
    filter_title_tier: new Set<Exclude<TitleTier, "none">>(),
    filter_totem_tier: new Set<Exclude<TotemTier, "none">>(),
  };

  for (const deed of blob) {
    if (deed.region_number) values.filter_regions.add(deed.region_number);
    if (deed.tract_number != null) values.filter_tracts.add(deed.tract_number);
    if (deed.plot_number != null) values.filter_plots.add(deed.plot_number);
    if (deed.rarity != null) values.filter_rarity.add(deed.rarity);
    const resource =
      deed.resource_symbol ?? parseLandStatsResources(deed.land_stats)[0];
    if (resource) values.filter_resources.add(resource);
    if (deed.worksite_type) values.filter_worksites.add(deed.worksite_type);
    if (deed.deed_type) values.filter_deed_type.add(deed.deed_type);
    if (deed.plot_status) values.filter_plot_status.add(deed.plot_status);
    if (deed.player) values.filter_players.add(deed.player);

    const titleBoost = deed.stakingDetail?.total_title_boost ?? 0;
    const titleTier = titleTierForBoost(titleBoost);
    if (titleTier) values.filter_title_tier.add(titleTier);

    const totemBoost = deed.stakingDetail?.total_totem_boost ?? 0;
    const totemTier = totemTierForBoost(totemBoost);
    if (totemTier) values.filter_totem_tier.add(totemTier);
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
    filter_title_tier: titleTierOrder.filter((tier) =>
      values.filter_title_tier.has(tier)
    ),
    filter_totem_tier: totemTierOrder.filter((tier) =>
      values.filter_totem_tier.has(tier)
    ),
  };
}

/** Server-side enrichment (DB deeds); taxes are read with the server client. */
export function enrichWithProgressInfo(
  deeds: DeedComplete[]
): Promise<DeedComplete[]> {
  return enrichWithProgressInfoShared(deeds, getCachedTaxes);
}

export function enrichWithProductionInfo(
  deeds: DeedComplete[],
  prices: Prices
): Promise<DeedComplete[]> {
  return enrichWithProductionInfoShared(deeds, prices, getCachedTaxes);
}

function ensureRegionBucket(
  result: Record<string, RegionTax>,
  regionUid: string,
  regionNumber: number
): RegionTax {
  if (!result[regionUid]) {
    result[regionUid] = {
      castleOwner: { regionUid, regionNumber },
      resourceRewardsPerHour: {},
      capturedTaxInResource: {},
      capturedTaxInDEC: {},
      perTract: {},
    };
  }
  return result[regionUid];
}

function ensureTractBucket(region: RegionTax, tractNumber: number) {
  if (!region.perTract[tractNumber]) {
    region.perTract[tractNumber] = {
      keepOwner: {
        regionUid: region.castleOwner.regionUid,
        regionNumber: region.castleOwner.regionNumber,
        tractNumber,
      },
      resourceRewardsPerHour: {},
      capturedTaxInResource: {},
      capturedTaxInDEC: {},
    };
  }
}

export function calculateRegionTax(
  deeds: DeedComplete[],
  resourcePrices: Prices
): RegionTax[] {
  const result: Record<string, RegionTax> = {};

  for (const deed of deeds) {
    const resource = deed.worksiteDetail?.token_symbol ?? "";
    if (!resource) continue;

    const regionUid = deed.region_uid!;
    const regionNumber = deed.region_number!;
    const tractNumber = deed.tract_number!;
    const plotNumber = deed.plot_number!;
    const rewardsPerHour = deed.worksiteDetail?.rewards_per_hour ?? 0;
    const worksiteType = deed.worksiteDetail?.worksite_type ?? "";

    const region = ensureRegionBucket(result, regionUid, regionNumber);
    ensureTractBucket(region, tractNumber);

    if (resource === "TAX") {
      const player = deed.player!;
      const captureRate = deed.worksiteDetail?.captured_tax_rate ?? 0;
      if (worksiteType === "CASTLE") {
        region.castleOwner = {
          regionUid,
          regionNumber,
          tractNumber,
          plotNumber,
          player,
          captureRate,
        };
      } else {
        region.perTract[tractNumber].keepOwner = {
          regionUid,
          regionNumber,
          tractNumber,
          plotNumber,
          player,
          captureRate,
        };
      }
    } else {
      region.resourceRewardsPerHour[resource] =
        (region.resourceRewardsPerHour[resource] ?? 0) + rewardsPerHour;
      region.perTract[tractNumber].resourceRewardsPerHour[resource] =
        (region.perTract[tractNumber].resourceRewardsPerHour[resource] ?? 0) +
        rewardsPerHour;
    }
  }

  // Calculate taxes
  for (const region of Object.values(result)) {
    // Region level
    for (const [token, rewardsPerHour] of Object.entries(
      region.resourceRewardsPerHour
    )) {
      const captureRate = region.castleOwner.captureRate ?? 0;
      const tax = rewardsPerHour * TAX_RATE * captureRate;
      const decPrice = resourcePrices[token] ?? 0;
      region.capturedTaxInResource[token] = tax;
      region.capturedTaxInDEC[token] = tax * decPrice;
    }

    // Tract level
    for (const tract of Object.values(region.perTract)) {
      const captureRate = tract.keepOwner.captureRate ?? 0;
      for (const [token, rewardsPerHour] of Object.entries(
        tract.resourceRewardsPerHour
      )) {
        const tax = rewardsPerHour * TAX_RATE * captureRate;
        const decPrice = resourcePrices[token] ?? 0;
        tract.capturedTaxInResource[token] = tax;
        tract.capturedTaxInDEC[token] = tax * decPrice;
      }
    }
  }

  return Object.values(result);
}
