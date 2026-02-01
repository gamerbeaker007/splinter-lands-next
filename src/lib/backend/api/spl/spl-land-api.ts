import { Deed, PlayerTradeHubPosition } from "@/generated/prisma/client";
import { RawRegionDataResponse } from "@/types/RawRegionDataResponse";
import { DeedComplete } from "@/types/deed";
import { SplDeedHarvestActionsResponse } from "@/types/deedHarvest";
import { SplDeedProjectsResponse } from "@/types/deedProjects";
import { Assets } from "@/types/planner/market/market";
import { AuraPrices } from "@/types/price";
import { ResourceSupplyResponse } from "@/types/resourceSupplyResponse";
import { SplLandPool } from "@/types/spl/landPools";
import { SplMarketAsset } from "@/types/splMarketAsset";
import { SplTaxes } from "@/types/splTaxes";
import axios from "axios";
import * as rax from "retry-axios";
import { NotFoundError } from "../../error";
import { logError } from "../../log/logUtils";
import logger from "../../log/logger.server";
import { DEFAULT_RETRY_CONFIG } from "./retryConfig";

const splLandClient = axios.create({
  baseURL: "https://vapi.splinterlands.com",
  timeout: 60000,
  headers: {
    "Accept-Encoding": "gzip, deflate, br, zstd",
    "User-Agent": "SPL-Data/1.0",
  },
});

rax.attach(splLandClient);
splLandClient.defaults.raxConfig = DEFAULT_RETRY_CONFIG;

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
  player: string
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
  const url = `/land/liquidity/region/${encodeURIComponent(player)}`;
  const res = await splLandClient.get(url);

  logger.info(`SPL API - fetch land player liquidity for: ${player}`);
  const data = res.data?.data;
  if (!data) throw new Error("Invalid response from Splinterlands API");

  return data;
}

export async function fetchStakedAssets(deed_uid: string) {
  const url = `/land/stake/deeds/${encodeURIComponent(deed_uid)}/assets`;
  const res = await splLandClient.get(url);

  const data = res.data?.data;
  if (!data) throw new Error("Invalid response from Splinterlands API");

  return data;
}

export async function fetchPlayerPoolInfo(
  player: string
): Promise<PlayerTradeHubPosition[]> {
  const url = `land/liquidity/pools/${encodeURIComponent(player)}/all-no-vesting`;
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
  const url = `/land/deeds/${encodeURIComponent(plotId)}`;
  const res = await splLandClient.get(url);

  const data = res.data?.data;
  if (!data) throw new NotFoundError(`Plot ${plotId} not found`);

  return data as DeedComplete;
}

export async function fetchLandResourcesPools(): Promise<SplLandPool[]> {
  const url = `/land/liquidity/landpools`;
  console.info(`SPL API - fetch land resources pools`);
  const res = await splLandClient.get(url);

  const data = res.data?.data;
  if (!data) throw new Error("Invalid response from Splinterlands API");
  return (data as SplLandPool[]) || [];
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
  filter?: Assets[]
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

    const auraItems = [
      "MIDNIGHTPOT",
      "FT",
      "AM",
      "WAGONKIT",
      "UNBIND_CA_C",
      "UNBIND_CA_R",
      "UNBIND_CA_E",
      "UNBIND_CA_L",
      "POLYMORPH",
      "FLUX",
    ];

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
  const url = `land/resources/taxes/${encodeURIComponent(deedUid)}`;

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

const DEFAULT_DEED_LIMIT = 100;

/**
 * Fetch deed projects for a specific deed UID
 * @param deedUid The deed UID (e.g., "I-295-1aa8c0692dc15d")
 * @param limit Number of records per request
 * @param offset Starting position
 */
export async function fetchDeedProjects(
  deedUid: string,
  limit: number = DEFAULT_DEED_LIMIT,
  offset: number = 0
): Promise<SplDeedProjectsResponse> {
  const url = `/land/projects/deed/${deedUid}/list`;
  const res = await splLandClient.get(url, {
    params: { limit, offset },
  });

  if (!res.data || res.data.status !== "success") {
    throw new Error("Invalid response from Splinterlands API");
  }

  return res.data as SplDeedProjectsResponse;
}

/**
 * Fetch all deed projects for a specific deed UID (paginated)
 * @param deedUid The deed UID
 * @param limit Number of records per request
 */
export async function fetchAllDeedProjects(
  deedUid: string,
  limit: number = DEFAULT_DEED_LIMIT
): Promise<SplDeedProjectsResponse> {
  const allProjects: SplDeedProjectsResponse["data"] = [];
  let offset = 0;
  let hasMore = true;
  let iterations = 0;
  const maxIterations = 100; // Max 100 iterations (10,000 records with default limit)

  while (hasMore) {
    const response = await fetchDeedProjects(deedUid, limit, offset);
    allProjects.push(...response.data);

    // If we received fewer records than the limit, we've reached the end
    hasMore = response.data.length === limit;

    // Use the last project ID as the offset for the next request
    if (hasMore && response.data.length > 0) {
      offset = response.data[response.data.length - 1].id;
    }

    iterations++;

    // Safety check to prevent infinite loops
    if (iterations >= maxIterations) {
      logger.warn(
        `fetchAllDeedProjects: Exceeded maximum iterations (${maxIterations}) for deed ${deedUid}, fetched ${allProjects.length} records`
      );
      break;
    }
  }

  return {
    status: "success",
    data: allProjects,
  };
}

/**
 * Fetch deed harvest/reward actions for a specific deed UID
 * @param deedUid The deed UID (e.g., "I-295-1aa8c0692dc15d")
 * @param limit Number of records per request
 * @param offset Starting position
 */
export async function fetchDeedHarvestActions(
  deedUid: string,
  limit: number = DEFAULT_DEED_LIMIT,
  offset: number = 0
): Promise<SplDeedHarvestActionsResponse> {
  const url = `/land/resources/rewardactions/${deedUid}`;
  const res = await splLandClient.get(url, {
    params: { limit, offset },
  });

  if (!res.data || res.data.status !== "success") {
    throw new Error("Invalid response from Splinterlands API");
  }

  return res.data as SplDeedHarvestActionsResponse;
}

/**
 * Fetch all deed harvest/reward actions for a specific deed UID (paginated)
 * @param deedUid The deed UID
 * @param limit Number of records per request
 */
export async function fetchAllDeedHarvestActions(
  deedUid: string,
  limit: number = DEFAULT_DEED_LIMIT
): Promise<SplDeedHarvestActionsResponse> {
  const allActions: SplDeedHarvestActionsResponse["data"] = [];
  let offset = 0;
  let hasMore = true;
  let iterations = 0;
  const maxIterations = 100; // Max 100 iterations (10,000 records with default limit)

  while (hasMore) {
    const response = await fetchDeedHarvestActions(deedUid, limit, offset);
    allActions.push(...response.data);

    // If we received fewer records than the limit, we've reached the end
    hasMore = response.data.length === limit;

    // Use the last action ID as the offset for the next request
    if (hasMore && response.data.length > 0) {
      offset = response.data[response.data.length - 1].id;
    }

    iterations++;

    // Safety check to prevent infinite loops
    if (iterations >= maxIterations) {
      logger.warn(
        `fetchAllDeedHarvestActions: Exceeded maximum iterations (${maxIterations}) for deed ${deedUid}, fetched ${allActions.length} records`
      );
      break;
    }
  }

  return {
    status: "success",
    data: allActions,
  };
}
