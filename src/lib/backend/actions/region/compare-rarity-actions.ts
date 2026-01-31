"use server";

import { Resource } from "@/constants/resource/resource";
import { getCachedRegionDataSSR } from "@/lib/backend/api/internal/deed-data";
import { getCachedResourcePrices } from "@/lib/backend/services/resourceService";
import { filterDeeds } from "@/lib/filters";
import { calcConsumeCosts } from "@/lib/shared/costCalc";
import { ResourceRecipeItem } from "@/lib/shared/statics";
import { FilterInput } from "@/types/filters";
import { PlotRarity } from "@/types/planner";
import { RarityResourceSummary } from "@/types/regionCompareProduction";

/**
 * Get region compare rarity information.
 */
export async function getRegionCompareRarity(
  filters: FilterInput = {}
): Promise<RarityResourceSummary> {
  const blob = await getCachedRegionDataSSR();
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
    const isConstruction = deed.worksiteDetail?.is_construction ?? false;
    const resourceRecipe = deed.worksiteDetail?.resource_recipe as unknown as
      | ResourceRecipeItem[]
      | [];

    const consumeCost = calcConsumeCosts(
      totalBasePP,
      prices,
      siteEfficiency,
      resourceRecipe,
      isConstruction
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

    // Sum consumption
    for (const row of consumeCost ?? []) {
      if (!row?.resource || !Number.isFinite(row.amount)) continue;
      const r = row.resource as Resource;
      raritySummary[rarity]!.consumption[r] =
        (raritySummary[rarity]!.consumption[r] ?? 0) + row.amount;
    }
  }

  return raritySummary;
}
