import { Resource } from "@/constants/resource/resource";
import { calcCostsV2 } from "@/lib/shared/costCalc";
import { PRODUCING_RESOURCES, ResourceRecipeItem } from "@/lib/shared/statics";
import { DeedComplete } from "@/types/deed";
import { RegionSummary } from "@/types/resource";

const TAX_RATE = 0.9; // 10% tax rate reduced from production
const TRANSFER_FEE = 1.1; // 10% transfer fee added for resources with a deficit in the region

/**
 * Summarize per region the produce per hour and cost per hour
 * @param deeds
 */
function getRegionSummary(deeds: DeedComplete[]) {
  const summaryMap: Record<string, RegionSummary> = {};

  for (const deed of deeds) {
    const region = deed.region_uid!;
    const rewardsPerHour = deed.worksiteDetail?.rewards_per_hour ?? 0;
    const resource = (deed.worksiteDetail?.token_symbol ?? "") as Resource;
    const basePP = deed.stakingDetail?.total_base_pp_after_cap ?? 0;
    const siteEfficiency = deed.worksiteDetail?.site_efficiency ?? 0;
    const isConstruction = deed.worksiteDetail?.is_construction ?? false;
    const resourceRecipe = deed.worksiteDetail?.resource_recipe as unknown as
      | ResourceRecipeItem[]
      | undefined;

    if (resource != "TAX") {
      if (!summaryMap[region]) {
        // Initialize the summary entry for the region
        summaryMap[region] = {
          region_uid: region,
          resource: resource,
          totalBasePP: 0,
          totalBoostedPP: 0,
          countPlots: {} as Record<Resource, number>,
          countIsConstruction: {} as Record<Resource, number>,
          production: {} as Record<Resource, number>,
          consumption: {} as Record<Resource, number>,
          netResource: {} as Record<Resource, number>,
          netAdjustedResource: {} as Record<Resource, number>,
        };
      }

      // Sum the total produced rewards
      summaryMap[region].production[resource] =
        ((summaryMap[region].production[resource] as number) || 0) +
        rewardsPerHour;

      // Count the amount of plots
      summaryMap[region].countPlots[resource] =
        ((summaryMap[region].countPlots[resource] as number) || 0) + 1;

      // Count under construction plots
      if (isConstruction) {
        summaryMap[region].countIsConstruction[resource] =
          ((summaryMap[region].countIsConstruction[resource] as number) || 0) +
          1;
      }

      const costs: Record<Resource, number> = calcCostsV2(
        basePP,
        siteEfficiency,
        isConstruction,
        resourceRecipe
      );

      Object.entries(costs).forEach(([resource, value]) => {
        if (!summaryMap[region].consumption[resource as Resource]) {
          summaryMap[region].consumption[resource as Resource] = 0;
        }
        summaryMap[region].consumption[resource as Resource] += value;
      });
    }
  }
  return summaryMap;
}

export function prepareSummary(
  data: DeedComplete[],
  includeTaxes: boolean,
  includeTransferFee: boolean
): RegionSummary[] {
  const summaryMap = getRegionSummary(data);

  // Add missing resource columns and compute net + adjusted net
  const summaryArray = Object.values(summaryMap);
  for (const row of summaryArray) {
    for (const res of PRODUCING_RESOURCES) {
      const resource = res as Resource;
      //make sure the produce and cost column are defined before
      row.production[resource] = row.production[resource] || 0;
      row.consumption[resource] = row.consumption[resource] || 0;
      row.netResource[resource] = row.netResource[resource] || 0;
      row.netAdjustedResource[resource] =
        row.netAdjustedResource[resource] || 0;

      // Apply taxes on the producing resources
      if (includeTaxes) {
        row.production[resource] *= TAX_RATE;
      }

      // Apply transfer fees (if applicable)
      // For research aura sps it's not possible to have a deficit also not possible to transfer between regions
      // When you have a deficit in a resource 10% to compensate for the potential transfer fee
      if (["RESEARCH", "AURA", "SPS"].includes(res)) {
        row.netResource[resource] = row.production[resource];
        row.netAdjustedResource[resource] = row.netResource[resource];
      } else {
        row.netResource[resource] =
          row.production[resource] - row.consumption[resource];
        row.netAdjustedResource[resource] = includeTransferFee
          ? adjustTransferWithFee(row.netResource[resource])
          : row.netResource[resource];
      }
    }
  }

  return summaryArray;
}

function adjustTransferWithFee(value: number): number {
  if (value < 0) {
    return value * TRANSFER_FEE;
  } else {
    return value;
  }
}
