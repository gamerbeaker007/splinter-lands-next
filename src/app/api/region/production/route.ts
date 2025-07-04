import { getCachedRegionData } from "@/lib/backend/api/internal/deed-data";
import { logError } from "@/lib/backend/log/logUtils";
import { filterDeeds } from "@/lib/filters";
import { DEFAULT_ORDER_RESOURCES } from "@/lib/shared/statics";
import { FilterInput } from "@/types/filters";
import { NextResponse } from "next/server";
import { RegionPP, RegionResourcePP } from "@/types/regionProductionSummary";

export async function POST(req: Request) {
  try {
    const filters: FilterInput = await req.json();
    const blob = await getCachedRegionData();
    const filteredDeeds = filterDeeds(blob, filters);

    const result: RegionPP = {
      totalPP: { rawPP: 0, boostedPP: 0 },
      perResource: {},
    };

    for (const deed of filteredDeeds) {
      const resource = deed.worksiteDetail?.token_symbol ?? "";
      const region = deed.region_uid ?? "";

      const basePP = deed.stakingDetail?.total_base_pp_after_cap ?? 0;
      const harvestPP = deed.stakingDetail?.total_harvest_pp ?? 0;

      result.totalPP.rawPP += basePP;
      result.totalPP.boostedPP += harvestPP;

      // initialize bucket if needed
      if (!result.perResource[resource]) {
        result.perResource[resource] = {
          totalPP: { rawPP: 0, boostedPP: 0 },
          perRegion: {},
        };
      }
      result.perResource[resource].totalPP.rawPP += basePP;
      result.perResource[resource].totalPP.boostedPP += harvestPP;

      // initialize region bucket if needed
      if (!result.perResource[resource].perRegion[region]) {
        result.perResource[resource].perRegion[region] = {
          rawPP: 0,
          boostedPP: 0,
        };
      }

      result.perResource[resource].perRegion[region].rawPP += basePP;
      result.perResource[resource].perRegion[region].boostedPP += harvestPP;
    }

    const retVal = {
      totalPP: result.totalPP,
      perResource: orderPerResource(result.perResource),
    };

    return NextResponse.json(retVal);
  } catch (err) {
    logError("Failed to load active data", err);
    return NextResponse.json(
      { error: "Failed to load active data" },
      { status: 501 },
    );
  }
}

function orderPerResource(
  perResource: Record<string, RegionResourcePP>,
): Record<string, RegionResourcePP> {
  const ordered: Partial<Record<string, RegionResourcePP>> = {};
  for (const res of DEFAULT_ORDER_RESOURCES) {
    if (perResource[res]) {
      ordered[res] = perResource[res];
    }
  }
  return ordered as Record<string, RegionResourcePP>;
}
