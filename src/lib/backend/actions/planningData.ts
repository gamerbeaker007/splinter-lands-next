"use server";

import { getCachedRegionData } from "@/lib/backend/api/internal/deed-data";
import { getResourceDECPrices } from "@/lib/backend/helpers/resourcePrices";
import { getCachedCardDetailsData } from "@/lib/backend/services/cardService";
import { calculateRegionTax } from "@/lib/backend/services/regionService";
import { getCachedResourcePrices } from "@/lib/backend/services/resourceService";
import { getCachedSplPriceData } from "@/lib/backend/services/tokenService";
import { FilterInput } from "@/types/filters";
import { Prices, SplPriceData } from "@/types/price";
import { RegionTax } from "@/types/regionTax";
import { SplCardDetails } from "@/types/splCardDetails";
import { cacheLife } from "next/cache";


/**
 * TODO SPLIT INTO MULTIPLE FUNCTIONS AND CHECK CACHES!!!
 * @returns
 */


/**
 * Get card details with daily cache.
 */
export async function getPlanningCardDetails(): Promise<SplCardDetails[]> {
  "use cache";
  cacheLife("days");

  const result = await getCachedCardDetailsData();
  if (!result) {
    throw new Error("No card details found");
  }
  return result;
}

/**
 * Get resource prices with hourly cache.
 */
export async function getPlanningPrices(): Promise<Prices> {
  "use cache";
  cacheLife("hours");

  const data = await getResourceDECPrices();
  return data;
}

/**
 * Get SPS ratio with hourly cache.
 */
export async function getPlanningSPSRatio(): Promise<number> {
  "use cache";
  cacheLife("hours");

  const blob = await getCachedRegionData();
  const resource = ["SPS"];
  const { filterDeeds } = await import("@/lib/filters");
  const filteredDeeds = filterDeeds(blob, { filter_resources: resource });

  const ratios: number[] = [];

  for (const deed of filteredDeeds) {
    const boostedPP = deed.stakingDetail?.total_harvest_pp ?? 0;
    const rewards_per_hour = deed.worksiteDetail?.rewards_per_hour ?? 0;
    const site_efficiency = deed.worksiteDetail?.site_efficiency ?? 0;

    if (boostedPP > 0 && site_efficiency > 0.01 && rewards_per_hour > 0) {
      const ratio = rewards_per_hour / (boostedPP * site_efficiency);
      if (!isNaN(ratio) && isFinite(ratio)) {
        ratios.push(ratio);
      }
    }
  }

  const avg =
    ratios.length > 0
      ? ratios.reduce((sum, r) => sum + r, 0) / ratios.length
      : 0;

  return avg;
}

/**
 * Get region tax information with hourly cache.
 */
export async function getPlanningRegionTax(
  filters: FilterInput = {}
): Promise<RegionTax[]> {
  "use cache";
  cacheLife("hours");

  const regionData = await getCachedRegionData();
  const resourcePrices = await getCachedResourcePrices();
  const regions = calculateRegionTax(regionData, resourcePrices);

  // Apply filters
  return regions
    .filter((region) => {
      if (
        filters.filter_regions &&
        filters.filter_regions.length > 0 &&
        !filters.filter_regions.includes(region.castleOwner.regionNumber)
      ) {
        return false;
      }
      return true;
    })
    .map((region) => {
      if (!filters.filter_tracts || filters.filter_tracts.length === 0) {
        return region;
      }

      const filteredTracts: typeof region.perTract = {};
      for (const [tractNumber, tract] of Object.entries(region.perTract)) {
        if (filters.filter_tracts.includes(Number(tractNumber))) {
          filteredTracts[Number(tractNumber)] = tract;
        }
      }

      return {
        ...region,
        perTract: filteredTracts,
      };
    });
}

/**
 * Get token prices with hourly cache.
 */
export async function getPlanningTokenPrices(): Promise<SplPriceData> {
  "use cache";
  cacheLife("hours");

  const data = await getCachedSplPriceData(false);

  // Convert Prices to SplPriceData
  const splPriceData: SplPriceData = {
    hive: data.hive ?? 0,
    hbd: data.hbd ?? 0,
    sps: data.sps ?? 0,
    dec: data.dec ?? 0,
    voucher: data.voucher ?? 0,
  };

  return splPriceData;
}
