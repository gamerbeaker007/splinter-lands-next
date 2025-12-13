import { Resource } from "@/constants/resource/resource";
import { mapRegionDataToDeedComplete } from "@/lib/backend/api/internal/player-data";
import {
  computeNetValues,
  computeResourceNetValue,
} from "@/lib/backend/helpers/computeNetValues";
import { prepareSummary } from "@/lib/backend/helpers/productionCosts";
import {
  calculateLCERatio,
  calculateLDERatio,
  calculateLPERatio,
} from "@/lib/backend/helpers/productionUtils";
import {
  enrichWithProgressInfo,
  getDeedsAlerts,
  summarizeDeedsData,
} from "@/lib/backend/services/regionService";
import { getCachedResourcePrices } from "@/lib/backend/services/resourceService";
import { filterDeeds } from "@/lib/filters";
import { TAX_RATE } from "@/lib/shared/statics";
import { enrichPoolData } from "@/scripts/lib/metrics/playerTradeHubPosition";
import { DeedComplete } from "@/types/deed";
import { PlayerOverview } from "@/types/playerOverview";
import { Prices } from "@/types/price";
import { RawRegionDataResponse } from "@/types/RawRegionDataResponse";
import { PlayerRegionDataType, RegionTaxSummary } from "@/types/resource";
import { SplPlayerCardCollection } from "@/types/splPlayerCardDetails";
import { SplPlayerDetails } from "@/types/splPlayerDetails";
import { SplTaxes } from "@/types/splTaxes";
import { StakedAssets } from "@/types/stakedAssets";
import { getCachedRegionDataSSR } from "../api/internal/deed-data";
import {
  fetchPlayerBalances,
  fetchPlayerCardCollection,
  fetchPlayerDetails,
} from "../api/spl/spl-base-api";
import {
  fetchLandResourcesPools,
  fetchPlayerLiquidity,
  fetchPlayerPoolInfo,
  fetchRegionDataPlayer,
  fetchStakedAssets,
  fetchTaxes,
} from "../api/spl/spl-land-api";
import { cache } from "../cache/cache";

export async function invalidatePlayerCaches(player: string) {
  const keysToInvalidate = [
    `player-card-collection:${player}`, // for now that only contains data that needs to be cleared after login
  ];
  for (const key of keysToInvalidate) {
    cache.del(key);
  }
}

export async function getCachedPlayerData(
  player: string,
  force = false
): Promise<RawRegionDataResponse> {
  const key = `region-data:${player}`;
  if (!force) {
    const cached = cache.get<RawRegionDataResponse>(key);
    if (cached) return cached;
  }

  const data = await fetchRegionDataPlayer(player);
  cache.set(key, data);
  return data;
}

export async function getCachedStakedAssets(
  deedUid: string,
  force = false
): Promise<StakedAssets> {
  const key = `staked-assets:${deedUid}`;
  if (!force) {
    const cached = cache.get<StakedAssets>(key);
    if (cached) return cached;
  }

  const data = await fetchStakedAssets(deedUid);
  const result: StakedAssets = {
    cards: data.cards || [],
    items: data.items || [],
  };

  cache.set(key, result);
  return result;
}

export async function getCachedPlayerDetails(
  player: string,
  force = false
): Promise<SplPlayerDetails> {
  const key = `player-details:${player}`;
  if (!force) {
    const cached = cache.get<SplPlayerDetails>(key);
    if (cached) return cached;
  }

  try {
    const res = await fetchPlayerDetails(player);
    cache.set(key, res);
    return res;
  } catch (err) {
    throw new Error(
      `Failed to fetch player details: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

export async function getCachedPlayerCardCollection(
  player: string,
  force = false
): Promise<SplPlayerCardCollection[]> {
  const key = `player-card-collection:${player}`;
  if (!force) {
    const cached = cache.get<SplPlayerCardCollection[]>(key);
    if (cached) return cached;
  }

  try {
    const res = await fetchPlayerCardCollection(player);
    cache.set(key, res);
    return res;
  } catch (err) {
    throw new Error(
      `Failed to fetch player collection: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

export async function getCachedTaxes(
  deedUid: string,
  force = false
): Promise<SplTaxes> {
  const key = `taxes:${deedUid}`;
  if (!force) {
    const cached = cache.get<SplTaxes>(key);
    if (cached) return cached;
  }

  try {
    const res = await fetchTaxes(deedUid);
    cache.set(key, res);
    return res;
  } catch (err) {
    throw new Error(
      `Failed to fetch player collection: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

export async function getCachedPlayerOverviewData(
  player: string,
  force = false
): Promise<PlayerOverview> {
  const key = `player-overview-data:${player}`;
  if (!force) {
    const cached = cache.get<PlayerOverview>(key);
    if (cached) return cached;
  }

  const deeds = mapRegionDataToDeedComplete(
    await fetchRegionDataPlayer(player)
  );
  const enrichedDeeds = await enrichWithProgressInfo(deeds);
  const summarizedRegionInfo = summarizeDeedsData(enrichedDeeds);
  const alerts = getDeedsAlerts(enrichedDeeds);

  const liquidityInfo = await fetchPlayerLiquidity(player);

  const poolInfo = await fetchPlayerPoolInfo(player);
  const metrics = await fetchLandResourcesPools();
  const today = new Date();
  poolInfo.map((row) => enrichPoolData(row, today, metrics));
  const liquidityPoolInfo = poolInfo;

  const balances = await fetchPlayerBalances(player, [
    "DEC",
    "SPS",
    "VOUCHER",
    "MIDNIGHTPOT",
    "WAGONKIT",
    "AM",
    "FT",
    "ALLOCATION_RIGHT_C",
    "ALLOCATION_RIGHT_R",
    "ALLOCATION_RIGHT_E",
    "ALLOCATION_RIGHT_L",
    "POWER_CORE_PURCHASES",
  ]);

  //DEC Income
  const playerRegionInfo = await processPlayerRegionInformation(deeds);
  const total_dec = playerRegionInfo.totals.totalDEC;

  //DEC Tax Income
  const allData = await getCachedRegionDataSSR();
  const resourcePrices = await getCachedResourcePrices();
  const playerData = filterDeeds(allData, {
    filter_players: [player],
    filter_worksites: ["KEEP", "CASTLE"],
  });
  const regionTaxSummary =
    playerData.length > 0
      ? processPlayerTaxIncome(playerData, allData, resourcePrices)
      : null;
  const totalTaxDEC = regionTaxSummary
    ? Object.entries(regionTaxSummary).reduce(
        (sum, [, region]) => sum + (Number(region.total_tax_dec) || 0),
        0
      )
    : null;

  const LDE_ratio = calculateLDERatio(
    total_dec,
    summarizedRegionInfo.totalDecInUse
  );
  const LCE_ratio_base = calculateLCERatio(
    total_dec,
    summarizedRegionInfo.totalBasePP
  );
  const LCE_ratio_boosted = calculateLCERatio(
    total_dec,
    summarizedRegionInfo.totalBoostedPP
  );
  const LPE_ratio = calculateLPERatio(
    total_dec,
    summarizedRegionInfo.deedsCount
  );

  const result: PlayerOverview = {
    summarizedRegionInfo: summarizedRegionInfo,
    liquidityInfo: liquidityInfo,
    liquidityPoolInfo: liquidityPoolInfo,
    balances: balances,
    alerts: alerts,
    LCERatioBase: LCE_ratio_base,
    LCERatioBoosted: LCE_ratio_boosted,
    LDERatio: LDE_ratio,
    LPERatio: LPE_ratio,
    totalDec: playerRegionInfo.totals.totalDEC,
    totalTaxDec: totalTaxDEC,
  };

  cache.set(key, result);
  return result;
}

export async function processPlayerRegionInformation(
  playerData: DeedComplete[]
): Promise<PlayerRegionDataType> {
  const regionSummary = prepareSummary(playerData, true, true);

  // add totals (dec + resources
  // dec + per resource
  const resourcePrices = await getCachedResourcePrices();

  const { dec_net, total_dec } = computeNetValues(
    regionSummary,
    resourcePrices
  );
  const resource_net = computeResourceNetValue(regionSummary);

  const totalResourceCounts: Record<Resource, number> = {} as Record<
    Resource,
    number
  >;
  playerData.forEach((deed: DeedComplete) => {
    const resource = deed.worksiteDetail?.token_symbol as Resource;
    if (resource) {
      totalResourceCounts[resource] = (totalResourceCounts[resource] || 0) + 1;
    }
  });

  return {
    regionSummary: regionSummary,
    totals: {
      netAdjustedResource: resource_net,
      totalDEC: total_dec,
      dec: dec_net,
      resourceCounts: totalResourceCounts,
    },
  };
}

export function processPlayerTaxIncome(
  playerData: DeedComplete[],
  allData: DeedComplete[],
  resourcePrices: Prices
): RegionTaxSummary[] {
  const results = [];
  for (const deed of playerData) {
    const capture_rate = deed.worksiteDetail?.captured_tax_rate ?? 0;
    const worksiteType = deed.worksiteDetail?.worksite_type;
    const regionUid = deed.region_uid!;
    let groupData = [];

    if (worksiteType === "KEEP") {
      const tractNumber = deed.tract_number ?? 0;
      const regionNumber = deed.region_number ?? 0;
      groupData = filterDeeds(allData, {
        filter_regions: [regionNumber],
        filter_tracts: [tractNumber],
      });
    } else if (worksiteType === "CASTLE") {
      const regionNumber = deed.region_number ?? 0;
      groupData = filterDeeds(allData, { filter_regions: [regionNumber] });
    } else {
      continue;
    }

    const resourceMap: Record<string, number> = {};

    for (const d of groupData) {
      const ws = d.worksiteDetail;
      if (ws && ws.token_symbol && typeof ws.rewards_per_hour === "number") {
        resourceMap[ws.token_symbol] =
          (resourceMap[ws.token_symbol] ?? 0) + ws.rewards_per_hour;
      }
    }

    let total_tax_dec = 0;

    const resources = Object.entries(resourceMap).map(
      ([token, total_rewards_per_hour]) => {
        const total_tax = total_rewards_per_hour * TAX_RATE;
        const captured = total_tax * capture_rate;
        const dec = resourcePrices[token] * captured;
        total_tax_dec += dec || 0;
        return { token, total_rewards_per_hour, total_tax, captured, dec };
      }
    );

    results.push({
      region_uid: regionUid,
      tract_number: deed.tract_number!,
      type: worksiteType,
      total_tax_dec: total_tax_dec,
      capture_rate: capture_rate,
      resources: resources,
    });
  }
  return results;
}
