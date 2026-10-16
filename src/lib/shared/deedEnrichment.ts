import { Resource } from "@/constants/resource/resource";
import { getProgressInfo } from "@/lib/backend/helpers/productionUtils";
import { formatCompactNumber } from "@/lib/formatters";
import { calcCostsWithDEC, calcDECPrice } from "@/lib/shared/costCalc";
import { ResourceRecipeItem, TAX_RATE } from "@/lib/shared/statics";
import { DeedComplete } from "@/types/deed";
import { DeedAlertsInfo } from "@/types/deedAlertsInfo";
import { Prices } from "@/types/price";
import { ProductionInfo, ResourceWithDEC } from "@/types/productionInfo";
import { ProductionPoints } from "@/types/productionPoints";
import { ProgressInfo } from "@/types/progressInfo";
import { RegionSummary } from "@/types/regionSummary";
import { SplTaxes } from "@/types/splTaxes";

/**
 * Deed enrichment and summaries, pure so they run in the browser (player
 * pages, on the player's own SPL reads) and on the server (region pages, on DB
 * data) alike. The only I/O — the tax vault of a Keep/Castle — is injected as
 * `getTaxes`, so each side passes its own fetch.
 */

/** Tax vault of one Keep/Castle deed (`/land/resources/taxes/<uid>`). */
export type GetDeedTaxes = (deedUid: string) => Promise<SplTaxes>;

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
  let totalDecSaved = 0;
  let totalDeeds = 0;
  let totalRawPP = 0;
  let totalBoostedPP = 0;
  let countEnergized = 0;
  let countLaborsLuck = 0;
  let totalBuildingInBox = 0;
  let totalUnstableTotems = 0;
  const laborsLuckOwners = new Set<string>();
  const countAbilityBoost: Partial<Record<Resource, number>> = {};
  let countBloodlinesBoost = 0;
  let countFoodDiscount = 0;
  let countLiteFoodDiscount = 0;
  let countDecStakeDiscount = 0;
  const totalAbilityBoostPP: Partial<Record<Resource, number>> = {};
  let totalBloodlinesBoostPP = 0;

  for (const deed of deeds) {
    const player = deed.player!;
    const regionUid = deed.region_uid!;
    const key = `${regionUid}-${player}`;
    const stats = JSON.parse(deed.stats?.toString() ?? "{}");

    totalBuildingInBox += stats.building_in_box ? 1 : 0;
    totalUnstableTotems += stats.unstable_totem ? 1 : 0;

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
      // discounts are negative (e.g. -0.2 = 20% off); -1 would divide by zero
      const discountDEC = staking.dec_stake_needed_discount ?? 0;
      if (discountDEC < 0 && discountDEC > -1) {
        const discountedDECNeeded = staking.total_dec_stake_needed ?? 0;
        const originalDECNeeded = discountedDECNeeded / (1 + discountDEC);
        totalDecSaved += originalDECNeeded - discountedDECNeeded;
      }

      totalRawPP += staking.total_base_pp_after_cap ?? 0;
      totalBoostedPP += staking.total_harvest_pp ?? 0;

      countEnergized += staking.is_energized ? 1 : 0;
      countLaborsLuck += staking.has_labors_luck ? 1 : 0;
      if (staking.has_labors_luck) {
        laborsLuckOwners.add(player);
      }
      if (staking.card_abilities_boost != null) {
        countAbilityBoost[deed.worksiteDetail?.token_symbol as Resource] =
          (countAbilityBoost[deed.worksiteDetail?.token_symbol as Resource] ??
            0) + (staking.card_abilities_boost > 0 ? 1 : 0);
      }
      // boosts are positive, discounts are negative (e.g. -0.2 = 20% off)
      countBloodlinesBoost += (staking.card_bloodlines_boost ?? 0) > 0 ? 1 : 0;
      countFoodDiscount += (staking.grain_food_discount ?? 0) < 0 ? 1 : 0;
      countLiteFoodDiscount += (staking.lite_food_discount ?? 0) < 0 ? 1 : 0;
      countDecStakeDiscount +=
        (staking.dec_stake_needed_discount ?? 0) < 0 ? 1 : 0;

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
    totalBuildingInBox,
    totalUnstableTotems,
    totalDecNeeded: totalDecNeeded,
    totalDecInUse: totalDecInUse,
    totalDecStaked: totalDecStaked,
    totalDecSaved: totalDecSaved,
    deedsCount: totalDeeds,
    totalBasePP: totalRawPP,
    totalBoostedPP: totalBoostedPP,
    countEnergized: countEnergized,
    countLaborsLuck: countLaborsLuck,
    countLaborsLuckUniqueOwners: laborsLuckOwners.size,
    countAbilityBoost: countAbilityBoost,
    countBloodlinesBoost: countBloodlinesBoost,
    countFoodDiscount: countFoodDiscount,
    countLiteFoodDiscount: countLiteFoodDiscount,
    countDecStakeDiscount: countDecStakeDiscount,
    totalAbilityBoostPP: totalAbilityBoostPP,
    totalBloodlinesBoostPP: totalBloodlinesBoostPP,
  };
}

async function getTaxInfo(deedUid: string, getTaxes: GetDeedTaxes) {
  const taxDetails = await getTaxes(deedUid);

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
     no more taxes will be collected until you withdraw some DEC. total balance: ${formatCompactNumber(totalCapacity, { maximumFractionDigits: 2 })}`;
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
  deeds: DeedComplete[],
  getTaxes: GetDeedTaxes
): Promise<DeedComplete[]> {
  return Promise.all(
    deeds.map(async (deed) => {
      const isTaxSymbol = deed.worksiteDetail?.token_symbol === "TAX";
      const progressInfo: ProgressInfo = isTaxSymbol
        ? await getTaxInfo(deed.deed_uid, getTaxes)
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
  prices: Prices,
  getTaxes: GetDeedTaxes
): Promise<DeedComplete[]> {
  return Promise.all(
    deeds.map(async (deed) => {
      const ws = deed.worksiteDetail;
      const st = deed.stakingDetail;
      if (!ws || !st) return { ...deed };

      const resource = ws.token_symbol as Resource;

      if (resource === "TAX") {
        const taxesDetails = await getTaxes(deed.deed_uid);

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

        const consumeCosts = calcCostsWithDEC(
          st.total_base_pp_after_cap ?? 0,
          prices,
          ws.site_efficiency ?? 0,
          ws.resource_recipe as unknown as ResourceRecipeItem[],
          ws.is_construction ?? false,
          st.grain_food_discount ?? 0,
          st.lite_food_discount ?? 0,
          ws.grain_req_per_hour ?? undefined
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
