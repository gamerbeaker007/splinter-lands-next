import { Deed, PlayerTradeHubPosition } from "@/generated/prisma";
import { RawRegionDataResponse } from "@/types/RawRegionDataResponse";
import { DeedComplete } from "@/types/deed";
import { AuraPrices } from "@/types/price";
import { ResourceSupplyResponse } from "@/types/resourceSupplyResponse";
import { SplMarketAsset } from "@/types/splMarketAsset";
import { SplTaxes } from "@/types/splTaxes";
import axios from "axios";
import * as rax from "retry-axios";
import { NotFoundError } from "../../error";
import { logError } from "../../log/logUtils";
import logger from "../../log/logger.server";
import { Assets } from "@/types/planner/market/market";

const splLandClient = axios.create({
  baseURL: "https://vapi.splinterlands.com",
  timeout: 60000,
  headers: {
    "Accept-Encoding": "gzip, deflate, br, zstd",
    "User-Agent": "SPL-Data/1.0",
  },
});

rax.attach(splLandClient);
splLandClient.defaults.raxConfig = {
  instance: splLandClient,
  retry: 10,
  retryDelay: 1000,
  backoffType: "exponential",
  statusCodesToRetry: [
    [429, 429],
    [500, 599],
  ],
  onRetryAttempt: (err) => {
    const cfg = rax.getConfig(err);
    logger.warn(`Retry attempt #${cfg?.currentRetryAttempt}`);
  },
};

export async function fetchRegionData(region: number) {
  const url = "/land/deeds";
  const res = await splLandClient.get(url, {
    params: { region_number: region },
  });

  const data = res.data?.data;

  if (!data) throw new Error("Invalid response from Splinterlands API");

  return {
    deeds: data.deeds,
    worksite_details: data.worksite_details,
    staking_details: data.staking_details,
  };
}

export async function fetchRegionDataPlayer(
  player: string,
): Promise<RawRegionDataResponse> {
  const url = "/land/deeds";
  const res = await splLandClient.get(url, {
    params: { player: player },
  });

  logger.info(`SPL API - fetch land deeds for: ${player}`);
  const data = res.data?.data;
  if (!data) throw new Error("Invalid response from Splinterlands API");

  return {
    deeds: data.deeds,
    worksite_details: data.worksite_details,
    staking_details: data.staking_details,
  };
}

export async function fetchPlayerLiquidity(player: string) {
  const url = `/land/liquidity/region/${player}`;
  const res = await splLandClient.get(url);

  logger.info(`SPL API - fetch land player liquidity for: ${player}`);
  const data = res.data?.data;
  if (!data) throw new Error("Invalid response from Splinterlands API");

  return data;
}

export async function fetchStakedAssets(deed_uid: string) {
  const url = `/land/stake/deeds/${deed_uid}/assets`;
  const res = await splLandClient.get(url);

  const data = res.data?.data;
  if (!data) throw new Error("Invalid response from Splinterlands API");

  return data;
}

export async function fetchPlayerPoolInfo(
  player: string,
): Promise<PlayerTradeHubPosition[]> {
  const url = `land/liquidity/pools/${player}/all-no-vesting`;
  const res = await splLandClient.get(url);

  const data = res.data?.data;
  if (!data) throw new Error("Invalid response from Splinterlands API");

  return data.all.positions
    .filter((pos: PlayerTradeHubPosition) => pos.token !== "DEC-VOUCHER")
    .map((pos: PlayerTradeHubPosition) => ({
      player: player,
      token: pos.token,
      balance: pos.balance,
      total_fees_earned_dec: pos.total_fees_earned_dec,
      total_fees_earned_resource: pos.total_fees_earned_resource,
      fees_earned_dec_1: pos.fees_earned_dec_1,
      fees_earned_resource_1: pos.fees_earned_resource_1,
      fees_earned_dec_30: pos.fees_earned_dec_30,
      fees_earned_resource_30: pos.fees_earned_resource_30,
      share_percentage: 0,
    }));
}

export async function fetchDeedUid(plotId: number) {
  const url = `/land/deeds/${plotId}`;
  const res = await splLandClient.get(url);

  const data = res.data?.data;
  if (!data) throw new NotFoundError(`Plot ${plotId} not found`);

  return data as DeedComplete;
}

export async function getLandResourcesPools() {
  const url = `/land/liquidity/landpools`;
  const res = await splLandClient.get(url);

  const data = res.data?.data;
  if (!data) throw new Error("Invalid response from Splinterlands API");
  return data || [];
}

export async function fetchResourceSupply(resource: string) {
  const url = "/land/resources/leaderboards";
  const params = new URLSearchParams({
    territory: "",
    region: "",
    resource,
    player: "",
    limit: "150000",
  });

  const res = await splLandClient.get(url, { params: params });

  const data = res.data?.data;
  if (!data) throw new Error("Invalid response from Splinterlands API");

  return Array.isArray(data) ? (data as ResourceSupplyResponse[]) : [];
}

export async function fetchAssetsPrices(
  filter?: Assets[],
): Promise<SplMarketAsset[]> {
  try {
    const url = "/market/landing";
    const params =
      filter && filter.length > 0 ? { assets: filter.join(",") } : {};

    const res = await splLandClient.get(url, { params });

    const data = res.data?.data;
    if (!data) throw new Error("Invalid response from Splinterlands API");

    return data.assets as SplMarketAsset[];
  } catch (error) {
    logger.error("❌ Failed to fetch asset prices:", error);
    return [];
  }
}

export async function getAURAPrices(): Promise<AuraPrices[]> {
  try {
    const url = "/market/landing";
    const params = { assets: "CONSUMABLES" };

    const res = await splLandClient.get(url, { params });

    const assets = res.data?.data?.assets;
    if (!Array.isArray(assets)) {
      logger.warn("⚠️ No assets array found in response.");
      return [];
    }

    const auraItems = ["MIDNIGHTPOT", "FT", "AM", "WAGONKIT"];

    return assets
      .filter((asset) => auraItems.includes(asset.detailId))
      .map((assets) => {
        return {
          detailId: assets.detailId,
          minPrice: assets.prices?.[0]?.minPrice,
        };
      });
  } catch (error) {
    logError("❌ Failed to fetch Midnight Potion price:", error);
    return [];
  }
}

export async function fetchTaxes(deedUid: string) {
  const url = `land/resources/taxes/${deedUid}`;

  const res = await splLandClient.get(url);

  const data = res.data?.data;
  if (!data) throw new Error("Invalid response from Splinterlands API");

  return data as SplTaxes;
}

export async function fetchMarketLandData() {
  const url = `/land/deeds`;
  const params = { status: "market" };

  const res = await splLandClient.get(url, { params });

  const data = res.data?.data;
  if (!data) throw new Error("Invalid response from Splinterlands API");

  return data.deeds as Deed[];
}
