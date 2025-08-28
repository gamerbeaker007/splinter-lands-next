import { getCachedRegionData } from "@/lib/backend/api/internal/deed-data";
import { logError } from "@/lib/backend/log/logUtils";
import { filterDeeds } from "@/lib/filters";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const blob = await getCachedRegionData();
    const resource = ["SPS"];
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
    return NextResponse.json(avg);
  } catch (err) {
    logError("Failed to load active data", err);
    return NextResponse.json(
      { error: "Failed to load active data" },
      { status: 501 },
    );
  }
}
