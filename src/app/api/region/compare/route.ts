import { getCachedRegionData } from "@/lib/backend/api/internal/deed-data";
import { logError } from "@/lib/backend/log/logUtils";
import { filterDeeds } from "@/lib/filters";
import { DEFAULT_ORDER_RESOURCES } from "@/lib/shared/statics";
import { FilterInput } from "@/types/filters";
import { ProductionPoints } from "@/types/productionPoints";
import { CompareProductionPoint as CompareProductionPoint } from "@/types/regionCompareProduction";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const filters: FilterInput = await req.json();
    const blob = await getCachedRegionData();
    const filteredDeeds = filterDeeds(blob, filters);

    const method: "plot" | "tract" | "region" = filters.filter_plots?.length
      ? "plot"
      : filters.filter_tracts?.length
        ? "tract"
        : filters.filter_regions?.length
          ? "region"
          : "region";

    const result: {
      totalPP: { rawPP: number; boostedPP: number };
      perResource: Record<string, Record<string, ProductionPoints>>;
    } = {
      totalPP: { rawPP: 0, boostedPP: 0 },
      perResource: {},
    };

    for (const deed of filteredDeeds) {
      const resource = deed.worksiteDetail?.token_symbol ?? "";
      if (!resource) continue;

      const groupKey =
        method === "plot"
          ? `${deed.region_uid}-${deed.tract_number}-${deed.plot_number}`
          : method === "tract"
            ? `${deed.region_uid}-${deed.tract_number}`
            : deed.region_uid;

      if (!groupKey) continue;

      const basePP = deed.stakingDetail?.total_base_pp_after_cap ?? 0;
      const harvestPP = deed.stakingDetail?.total_harvest_pp ?? 0;

      result.totalPP.rawPP += basePP;
      result.totalPP.boostedPP += harvestPP;

      if (!result.perResource[resource]) {
        result.perResource[resource] = {};
      }

      if (!result.perResource[resource][groupKey]) {
        result.perResource[resource][groupKey] = { basePP: 0, boostedPP: 0 };
      }

      result.perResource[resource][groupKey].basePP += basePP;
      result.perResource[resource][groupKey].boostedPP += harvestPP;
    }

    // Optional: reorder resources if needed
    const orderedPerResource: Record<
      string,
      Record<string, ProductionPoints>
    > = {};
    for (const res of DEFAULT_ORDER_RESOURCES) {
      if (result.perResource[res]) {
        orderedPerResource[res] = result.perResource[res];
      }
    }

    const retVal: CompareProductionPoint = {
      method,
      totalPP: result.totalPP,
      perResource: orderedPerResource,
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
