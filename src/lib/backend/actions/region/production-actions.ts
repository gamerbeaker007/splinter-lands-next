"use server";

import { Resource } from "@/constants/resource/resource";
import { getCachedRegionDataSSR } from "@/lib/backend/api/internal/deed-data";
import { filterDeeds } from "@/lib/filters";
import { DEFAULT_ORDER_RESOURCES } from "@/lib/shared/statics";
import { FilterInput } from "@/types/filters";
import { ProductionPoints } from "@/types/productionPoints";
import { RegionPP, RegionResourcePP } from "@/types/regionProductionSummary";

export async function getRegionProductionData(
  filters: FilterInput
): Promise<RegionPP> {
  const blob = await getCachedRegionDataSSR();
  const filteredDeeds = filterDeeds(blob, filters);

  const result: RegionPP = {
    totalPP: { basePP: 0, boostedPP: 0 },
    laborsLuckPP: { basePP: 0, boostedPP: 0 },
    perResource: {} as Record<Resource, RegionResourcePP>,
  };

  for (const deed of filteredDeeds) {
    const resource = (deed.worksiteDetail?.token_symbol ?? "") as Resource;
    const region = deed.region_uid;

    const basePP = deed.stakingDetail?.total_base_pp_after_cap ?? 0;
    const harvestPP = deed.stakingDetail?.total_harvest_pp ?? 0;

    result.totalPP.basePP += basePP;
    result.totalPP.boostedPP += harvestPP;

    if (deed.stakingDetail?.has_labors_luck) {
      result.laborsLuckPP.basePP += basePP;
      result.laborsLuckPP.boostedPP += harvestPP;
    }

    // initialize bucket if needed
    if (!result.perResource[resource]) {
      result.perResource[resource] = {
        totalPP: { basePP: 0, boostedPP: 0 },
        perRegion: {} as Record<Resource, ProductionPoints>,
      };
    }
    result.perResource[resource].totalPP.basePP += basePP;
    result.perResource[resource].totalPP.boostedPP += harvestPP;

    // initialize region bucket if needed
    if (!result.perResource[resource].perRegion[region]) {
      result.perResource[resource].perRegion[region] = {
        basePP: 0,
        boostedPP: 0,
      };
    }

    result.perResource[resource].perRegion[region].basePP += basePP;
    result.perResource[resource].perRegion[region].boostedPP += harvestPP;
  }

  return {
    totalPP: result.totalPP,
    laborsLuckPP: result.laborsLuckPP,
    perResource: orderPerResource(result.perResource),
  };
}

function orderPerResource(
  perResource: Record<Resource, RegionResourcePP>
): Record<Resource, RegionResourcePP> {
  const ordered: Partial<Record<Resource, RegionResourcePP>> = {};
  for (const res of DEFAULT_ORDER_RESOURCES) {
    const resource = res as Resource;
    if (perResource[resource]) {
      ordered[resource] = perResource[resource];
    }
  }
  return ordered as Record<Resource, RegionResourcePP>;
}
