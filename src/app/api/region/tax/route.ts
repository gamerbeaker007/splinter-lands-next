import { getCachedRegionData } from "@/lib/backend/api/internal/deed-data";
import { logError } from "@/lib/backend/log/logUtils";
import { calculateRegionTax } from "@/lib/backend/services/regionService";
import { getCachedResourcePrices } from "@/lib/backend/services/resourceService";
import { FilterInput } from "@/types/filters";
import { RegionTax } from "@/types/regionTax";
import { NextResponse } from "next/server";

function applyFilter(regions: RegionTax[], filters: FilterInput): RegionTax[] {
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
      return { ...region, perTract: filteredTracts };
    });
}

export async function POST(req: Request) {
  try {
    const filters: FilterInput = await req.json();
    const blob = await getCachedRegionData();
    const resourcePrices = await getCachedResourcePrices();

    const result = calculateRegionTax(blob, resourcePrices);

    const filtered = applyFilter(result, filters);
    return NextResponse.json(filtered);
  } catch (err) {
    logError("Failed to load active data", err);
    return NextResponse.json(
      { error: "Failed to load active data" },
      { status: 501 },
    );
  }
}
