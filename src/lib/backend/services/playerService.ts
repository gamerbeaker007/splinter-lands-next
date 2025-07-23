import { RawRegionDataResponse } from "@/types/RawRegionDataResponse";
import { cache } from "../cache/cache";
import {
  fetchPlayerLiquidity,
  fetchPlayerPoolInfo,
  fetchPlayerStakedAssets,
  fetchRegionDataPlayer,
  getLandResourcesPools,
} from "../api/spl/spl-land-api";
import { StakedAssets } from "@/types/stakedAssets";
import {
  fetchPlayerBalances,
  fetchPlayerDetails,
} from "../api/spl/spl-base-api";
import { SplPlayerDetails } from "@/types/splPlayerDetails";
import { PlayerOverview } from "@/types/playerOverview";
import {
  enrichWithProgressInfo,
  getDeedsAlerts,
  summarizeDeedsData,
} from "@/lib/backend/services/regionService";
import { mapRegionDataToDeedComplete } from "@/lib/backend/api/internal/player-data";
import { enrichPoolData } from "@/scripts/lib/metrics/playerTradeHubPosition";

export async function getCachedPlayerData(
  player: string,
  force = false,
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
  force = false,
): Promise<StakedAssets> {
  const key = `staked-assets:${deedUid}`;
  if (!force) {
    const cached = cache.get<StakedAssets>(key);
    if (cached) return cached;
  }

  const data = await fetchPlayerStakedAssets(deedUid);
  const result: StakedAssets = {
    cards: data.cards || [],
    items: data.items || [],
  };

  cache.set(key, result);
  return result;
}

export async function getCachedPlayerDetails(
  player: string,
  force = false,
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
      `Failed to fetch player details: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

export async function getCachedPlayerOverviewData(
  player: string,
  force = false,
): Promise<PlayerOverview> {
  const key = `player-overview-data:${player}`;
  if (!force) {
    const cached = cache.get<PlayerOverview>(key);
    if (cached) return cached;
  }

  const deeds = mapRegionDataToDeedComplete(
    await fetchRegionDataPlayer(player),
  );
  const enrichedDeeds = enrichWithProgressInfo(deeds);
  const summarizedRegionInfo = summarizeDeedsData(enrichedDeeds);
  const alerts = getDeedsAlerts(enrichedDeeds);

  const liquidityInfo = await fetchPlayerLiquidity(player);

  const poolInfo = await fetchPlayerPoolInfo(player);
  const metrics = await getLandResourcesPools();
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
  ]);

  const result: PlayerOverview = {
    summarizedRegionInfo: summarizedRegionInfo,
    liquidityInfo: liquidityInfo,
    liquidityPoolInfo: liquidityPoolInfo,
    balances: balances,
    alerts: alerts,
  };

  cache.set(key, result);
  return result;
}
