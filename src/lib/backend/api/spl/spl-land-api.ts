import { Deed } from "@/generated/prisma/client";
import { SPL_VAPI } from "@/lib/shared/config/spl-endpoints";
import { DeedComplete } from "@/types/deed";
import { Assets } from "@/types/planner/market/market";
import { AuraPrices } from "@/types/price";
import { ResourceSupplyResponse } from "@/types/resourceSupplyResponse";
import { SplMarketAsset } from "@/types/splMarketAsset";
import { NotFoundError } from "../../error";
import logger, { logError } from "../../log/logger.server";
import { splLandClient, splServerReads } from "./spl-clients";

/**
 * Server-side vapi.splinterlands.com reads. The per-player reads are the shared
 * implementations (lib/shared/spl/splReads.ts) bound to the server client —
 * re-exported here for the server callers that still need them (worker, region
 * tax views, plot import). Browser code uses lib/frontend/spl-browser-api.ts instead.
 */
export const fetchStakedAssets = splServerReads.fetchStakedAssets;
export const fetchPlayerPoolInfo = splServerReads.fetchPlayerPoolInfo;
export const fetchLandResourcesPools = splServerReads.fetchLandResourcesPools;
export const fetchTaxes = splServerReads.fetchTaxes;

export async function fetchRegionData(region: number) {
  const url = SPL_VAPI.LAND_DEEDS;
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

export async function fetchDeedUid(plotId: number) {
  const url = SPL_VAPI.LAND_DEED(plotId);
  const res = await splLandClient.get(url);

  const data = res.data?.data;
  if (!data) throw new NotFoundError(`Plot ${plotId} not found`);

  return data as DeedComplete;
}

export async function fetchResourceSupply(resource: string) {
  const url = SPL_VAPI.LAND_RESOURCE_LEADERBOARDS;
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
    const url = SPL_VAPI.MARKET_LANDING;
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
    const url = SPL_VAPI.MARKET_LANDING;
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
      "LUSTROUS",
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

export async function fetchMarketLandData() {
  const url = SPL_VAPI.LAND_DEEDS;
  const params = { status: "market" };

  const res = await splLandClient.get(url, { params });

  const data = res.data?.data;
  if (!data) throw new Error("Invalid response from Splinterlands API");

  return data.deeds as Deed[];
}
