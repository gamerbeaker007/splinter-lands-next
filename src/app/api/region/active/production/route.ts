import { getCachedRegionData } from "@/lib/backend/api/internal/deed-data";
import { logError } from "@/lib/backend/log/logUtils";
import { filterDeeds } from "@/lib/filters";
import { DEFAULT_ORDER_RESOURCES } from "@/lib/shared/statics";
import { FilterInput } from "@/types/filters";
import { RegionActiveSummary } from "@/types/regionActiveSummary";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const filters: FilterInput = await req.json();
    const blob = await getCachedRegionData();
    const filteredDeeds = filterDeeds(blob, filters);

    const result: Record<string, RegionActiveSummary> = {};

    for (const deed of filteredDeeds) {
      const resource = deed.worksiteDetail?.token_symbol ?? "";

      const isActive = (deed.stakingDetail?.total_harvest_pp ?? 0) > 0;
      const isEmpty = deed.worksiteDetail?.worksite_type === "";
      const isConstruction = deed.worksiteDetail?.is_construction ?? false;
      const isActiveButEmpty = isActive && isEmpty;

      const basePP = deed.stakingDetail?.total_base_pp_after_cap ?? 0;
      const harvestPP = deed.stakingDetail?.total_harvest_pp ?? 0;

      // initialize bucket if needed
      if (!result[resource]) {
        result[resource] = {
          totalActiveDeeds: 0,
          activeEmpty: 0,
          productionPoints: { basePP: 0, boostedPP: 0 },
          totalConstruction: 0,
        };
      }

      if (isActive) result[resource].totalActiveDeeds++;
      if (isActiveButEmpty) result[resource].activeEmpty++;
      if (isConstruction) result[resource].totalConstruction++;
      result[resource].productionPoints.basePP += basePP;
      result[resource].productionPoints.boostedPP += harvestPP;
    }

    const orderedResourceMap: Record<string, RegionActiveSummary> = {};
    for (const res of DEFAULT_ORDER_RESOURCES) {
      if (result[res]) {
        orderedResourceMap[res] = result[res];
      }
    }

    return NextResponse.json(orderedResourceMap);
  } catch (err) {
    logError("Failed to load active data", err);
    return NextResponse.json(
      { error: "Failed to load active data" },
      { status: 501 }
    );
  }
}
