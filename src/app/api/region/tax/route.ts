import { getCachedRegionData } from "@/lib/backend/api/internal/deed-data";
import { logError } from "@/lib/backend/log/logUtils";
import { getCachedResourcePrices } from "@/lib/backend/services/resourceService";
import { FilterInput } from "@/types/filters";
import { RegionTax } from "@/types/regionTax";
import { NextResponse } from "next/server";

const TAX_RATE = 0.1;

function ensureRegionBucket(
  result: Record<string, RegionTax>,
  regionUid: string,
  regionNumber: number,
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

function applyFilter(
  result: Record<string, RegionTax>,
  filters: FilterInput,
): RegionTax[] {
  const regions = Object.values(result);

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

    const result: Record<string, RegionTax> = {};

    for (const deed of blob) {
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
        region.resourceRewardsPerHour,
      )) {
        const captureRate = region.castleOwner.captureRate ?? 0;
        const tax = rewardsPerHour * TAX_RATE * captureRate;
        const decPrice = resourcePrices[token.toLowerCase()] ?? 0;
        region.capturedTaxInResource[token] = tax;
        region.capturedTaxInDEC[token] = tax * decPrice;
      }

      // Tract level
      for (const tract of Object.values(region.perTract)) {
        const captureRate = tract.keepOwner.captureRate ?? 0;
        for (const [token, rewardsPerHour] of Object.entries(
          tract.resourceRewardsPerHour,
        )) {
          const tax = rewardsPerHour * TAX_RATE * captureRate;
          const decPrice = resourcePrices[token.toLowerCase()] ?? 0;
          tract.capturedTaxInResource[token] = tax;
          tract.capturedTaxInDEC[token] = tax * decPrice;
        }
      }
    }

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
