import { Resource } from "@/constants/resource/resource";
import { getCachedRegionData } from "@/lib/backend/api/internal/deed-data";
import { logError } from "@/lib/backend/log/logUtils";
import { getCachedResourcePrices } from "@/lib/backend/services/resourceService";
import { filterDeeds } from "@/lib/filters";
import { calcConsumeCosts } from "@/lib/shared/costCalc";
import { FilterInput } from "@/types/filters";
import { PlotRarity } from "@/types/planner";
import { RarityResourceSummary } from "@/types/regionCompareProduction";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const filters: FilterInput = await req.json();
    const blob = await getCachedRegionData();
    const filteredDeeds = filterDeeds(blob, filters);

    const prices = await getCachedResourcePrices();

    const raritySummary: RarityResourceSummary = {};

    for (const deed of filteredDeeds) {
      const resource = deed.worksiteDetail?.token_symbol as Resource;
      if (resource === "TAX") continue; // Skip TAX

      const rarity = (deed.rarity ?? "Unknown") as PlotRarity;
      if (!rarity || rarity === "Unknown") continue;

      const rewardsPerHour = deed.worksiteDetail?.rewards_per_hour ?? 0;
      const totalBasePP = deed.stakingDetail?.total_base_pp_after_cap ?? 0;
      const siteEfficiency = deed.worksiteDetail?.site_efficiency ?? 1;

      const consumeCost = calcConsumeCosts(
        resource,
        totalBasePP,
        prices,
        siteEfficiency,
      );

      // Initialize rarity entry if not present
      if (!raritySummary[rarity]) {
        raritySummary[rarity] = { production: {}, consumption: {} };
      }

      // Sum production
      if (resource) {
        raritySummary[rarity]!.production[resource] =
          (raritySummary[rarity]!.production[resource as Resource] ?? 0) +
          rewardsPerHour;
      }

      // Sum consumption (consumeCost is an object: { [resource]: amount })
      consumeCost.entries().forEach(([, row]) => {
        if (!row.resource) return;
        raritySummary[rarity]!.consumption[row.resource as Resource] =
          (raritySummary[rarity]!.consumption[row.resource as Resource] ?? 0) +
          row.amount;
      });
    }

    return NextResponse.json(raritySummary);
  } catch (err) {
    logError("Failed to load rarity compare data", err);
    return NextResponse.json(
      { error: "Failed to load rarity compare data" },
      { status: 501 },
    );
  }
}
