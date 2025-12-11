import { Resource } from "@/constants/resource/resource";
import { getProgressInfo } from "@/lib/backend/helpers/productionUtils";
import { formatNumberWithSuffix } from "@/lib/formatters";
import { calcConsumeCosts, calcDECPrice } from "@/lib/shared/costCalc";
import { ResourceRecipeItem, TAX_RATE } from "@/lib/shared/statics";
import { DeedComplete } from "@/types/deed";
import { DeedAlertsInfo } from "@/types/deedAlertsInfo";
import { FilterInput } from "@/types/filters";
import { Prices } from "@/types/price";
import { ProductionInfo, ResourceWithDEC } from "@/types/productionInfo";
import { ProductionPoints } from "@/types/productionPoints";
import { ProgressInfo } from "@/types/progressInfo";
import { RegionSummary } from "@/types/regionSummary";
import { RegionTax } from "@/types/regionTax";
import { filterDeeds } from "../../filters";
import { getCachedRegionDataSSR } from "../api/internal/deed-data";
import { getCachedTaxes } from "./playerService";

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
  const productionPoints: Partial<Record<Resource, ProductionPoints>> = {};
  const rewardsPerHour: Partial<Record<Resource, number>> = {};

  const seenPairs = new Set<string>();
  let runiCount = 0;
  let totalDecNeeded = 0;
  let totalDecInUse = 0;
  let totalDecStaked = 0;
  let totalDeeds = 0;
  let totalRawPP = 0;
  let totalBoostedPP = 0;
  let countEnergized = 0;
  let countLaborsLuck = 0;
  const countAbilityBoost: Partial<Record<Resource, number>> = {};
  let countBloodlinesBoost = 0;
  let countFoodDiscount = 0;
  let countDecStakeDiscount = 0;
  const totalAbilityBoostPP: Partial<Record<Resource, number>> = {};
  let totalBloodlinesBoostPP = 0;

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

      countEnergized += staking.is_energized ? 1 : 0;
      countLaborsLuck += staking.has_labors_luck ? 1 : 0;
      if (staking.card_abilities_boost != null) {
        countAbilityBoost[deed.worksiteDetail?.token_symbol as Resource] =
          (countAbilityBoost[deed.worksiteDetail?.token_symbol as Resource] ??
            0) + (staking.card_abilities_boost > 0 ? 1 : 0);
      }
      countBloodlinesBoost += (staking.card_bloodlines_boost ?? 0 > 0) ? 1 : 0;
      countFoodDiscount += (staking.grain_food_discount ?? 0 > 0) ? 1 : 0;
      countDecStakeDiscount +=
        (staking.dec_stake_needed_discount ?? 0 > 0) ? 1 : 0;

      const abilityBoost = staking.total_card_abilities_boost_pp ?? 0;
      if (abilityBoost > 0) {
        const resource = deed.worksiteDetail?.token_symbol as Resource;
        totalAbilityBoostPP[resource] =
          (totalAbilityBoostPP[resource] ?? 0) + abilityBoost;
      }

      totalBloodlinesBoostPP += staking.total_card_bloodlines_boost_pp ?? 0;

      const resource = deed.worksiteDetail?.token_symbol as Resource;
      if (resource) {
        // Production points are calculated per resource
        productionPoints[resource] = {
          basePP:
            (productionPoints[resource]?.basePP ?? 0) +
            (staking.total_base_pp_after_cap ?? 0),
          boostedPP:
            (productionPoints[resource]?.boostedPP ?? 0) +
            (staking.total_harvest_pp ?? 0),
        };

        // Rewards per hour accumulation
        const rewards = deed.worksiteDetail?.rewards_per_hour ?? 0;
        rewardsPerHour[resource] = (rewardsPerHour[resource] ?? 0) + rewards;
      }
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
    rewardsPerHour: rewardsPerHour as Record<Resource, number>,
    productionPoints: productionPoints as Record<Resource, ProductionPoints>,
    totalDecNeeded: totalDecNeeded,
    totalDecInUse: totalDecInUse,
    totalDecStaked: totalDecStaked,
    deedsCount: totalDeeds,
    totalBasePP: totalRawPP,
    totalBoostedPP: totalBoostedPP,
    countEnergized: countEnergized,
    countLaborsLuck: countLaborsLuck,
    countAbilityBoost: countAbilityBoost,
    countBloodlinesBoost: countBloodlinesBoost,
    countFoodDiscount: countFoodDiscount,
    countDecStakeDiscount: countDecStakeDiscount,
    totalAbilityBoostPP: totalAbilityBoostPP,
    totalBloodlinesBoostPP: totalBloodlinesBoostPP,
  };
}

export async function getRegionSummary(
  filters: FilterInput
): Promise<RegionSummary> {
  const blob = await getCachedRegionDataSSR();
  const filteredDeeds = filterDeeds(blob, filters);

  return summarizeDeedsData(filteredDeeds);
}

export async function getUniquePlayerCountFromBlob(forceWait: boolean = false) {
  const blob = await getCachedRegionDataSSR(forceWait);

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

async function getTaxInfo(deedUid: string) {
  const taxDetails = await getCachedTaxes(deedUid);

  if (taxDetails) {
    const totalCapacity = taxDetails.capacity;
    const totalBalance = taxDetails.taxes.reduce(
      (sum, tax) => sum + tax.balance,
      0
    );
    const percentageDone = (totalBalance / totalCapacity) * 100;
    const infoStr = `${percentageDone.toFixed(2)}% Capacity`;
    const progressTooltip = `The current balance of your tax vaults.
     Once the total balance reaches the total capacity,
     no more taxes will be collected until you withdraw some DEC. total balance: ${formatNumberWithSuffix(totalCapacity)}`;
    return {
      percentageDone,
      infoStr,
      progressTooltip,
    };
  } else {
    return {
      percentageDone: 0,
      infoStr: "Failed to load",
      progressTooltip: "No tax details available",
    };
  }
}

export async function enrichWithProgressInfo(
  deeds: DeedComplete[]
): Promise<DeedComplete[]> {
  return Promise.all(
    deeds.map(async (deed) => {
      const isTaxSymbol = deed.worksiteDetail?.token_symbol === "TAX";
      const progressInfo: ProgressInfo = isTaxSymbol
        ? await getTaxInfo(deed.deed_uid)
        : getProgressInfo(
            deed.worksiteDetail?.hours_since_last_op ?? 0,
            deed.worksiteDetail?.project_created_date ?? null,
            deed.worksiteDetail?.projected_end ?? null,
            deed.stakingDetail?.total_harvest_pp ?? 0
          );

      return {
        ...deed,
        progressInfo,
      };
    })
  );
}

export function enrichWithProductionInfo(
  deeds: DeedComplete[],
  prices: Prices
): Promise<DeedComplete[]> {
  return Promise.all(
    deeds.map(async (deed) => {
      const ws = deed.worksiteDetail;
      const st = deed.stakingDetail;
      if (!ws || !st) return { ...deed };

      const resource = ws.token_symbol as Resource;

      if (resource === "TAX") {
        const taxesDetails = await getCachedTaxes(deed.deed_uid);

        const worksiteType = ws.worksite_type;
        const consume = worksiteType === "KEEP" ? 1000 : 10_000;

        const buyConsumeDEC = calcDECPrice("buy", "GRAIN", consume, prices);
        const sellConsumeDEC = calcDECPrice("sell", "GRAIN", consume, prices);
        const consumeCost: ResourceWithDEC = {
          resource: "GRAIN",
          amount: consume,
          buyPriceDEC: buyConsumeDEC,
          sellPriceDEC: sellConsumeDEC,
        };

        const produces: ResourceWithDEC[] = taxesDetails.taxes.map((tax) => {
          const amount = tax.balance;
          const resource = tax.token as Resource;
          return {
            resource,
            amount,
            buyPriceDEC: calcDECPrice("buy", resource, amount, prices),
            sellPriceDEC: calcDECPrice("sell", resource, amount, prices),
          };
        });

        const totalProducedInDEC = produces.reduce(
          (sum, row) => sum + Number(row.buyPriceDEC || 0),
          0
        );
        const netDEC = totalProducedInDEC - sellConsumeDEC;

        const productionInfo: ProductionInfo = {
          resource,
          consume: [consumeCost],
          produce: produces,
          netDEC: netDEC,
        };

        return {
          ...deed,
          productionInfo,
        };
      } else {
        const production = (ws.rewards_per_hour ?? 0) * (1 - TAX_RATE);
        const decIncomeBuy = calcDECPrice("buy", resource, production, prices);
        const decIncomeSell = calcDECPrice(
          "sell",
          resource,
          production,
          prices
        );

        const consumeCosts = calcConsumeCosts(
          st.total_base_pp_after_cap ?? 0,
          prices,
          ws.site_efficiency ?? 0,
          ws.resource_recipe as unknown as ResourceRecipeItem[]
        );
        const totalDECConsume = consumeCosts.reduce(
          (sum, row) => sum + Number(row.sellPriceDEC || 0),
          0
        );
        const netDEC = decIncomeSell - totalDECConsume;

        const productionIfo: ProductionInfo = {
          resource,
          produce: [
            {
              resource: resource,
              amount: production,
              buyPriceDEC: decIncomeBuy,
              sellPriceDEC: decIncomeSell,
            },
          ],
          consume: consumeCosts,
          netDEC: netDEC,
        };

        return {
          ...deed,
          productionInfo: productionIfo,
        };
      }
    })
  );
}

export function getDeedsAlerts(deeds: DeedComplete[]): DeedAlertsInfo[] {
  return deeds
    .filter(
      (deed) =>
        deed.progressInfo !== undefined &&
        deed.progressInfo !== null &&
        deed.progressInfo.percentageDone >= 100
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
