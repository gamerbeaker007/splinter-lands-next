"use server";
import { FilterInput } from "@/types/filters";
import { RegionTax } from "@/types/regionTax";
import { getCachedRegionDataSSR } from "../../api/internal/deed-data";
import { calculateRegionTax } from "../../services/regionService";
import { getActualResourcePrices } from "../resources/prices-actions";

/**
 * Get region tax information with hourly cache.
 */
export async function getRegionTax(
  filters: FilterInput = {}
): Promise<RegionTax[]> {
  const regionData = await getCachedRegionDataSSR();
  const resourcePrices = await getActualResourcePrices();
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
