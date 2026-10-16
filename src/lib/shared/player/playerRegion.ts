import { Resource } from "@/constants/resource/resource";
import {
  computeNetValues,
  computeResourceNetValue,
} from "@/lib/backend/helpers/computeNetValues";
import { prepareSummary } from "@/lib/backend/helpers/productionCosts";
import { filterDeeds } from "@/lib/filters";
import { TAX_RATE } from "@/lib/shared/statics";
import { DeedComplete } from "@/types/deed";
import { Prices } from "@/types/price";
import { PlayerRegionDataType, RegionTaxSummary } from "@/types/resource";

/**
 * Player region summary (production, costs, DEC net per region). Pure: the
 * browser runs it on the player's own deeds with prices from the server's
 * shared price cache.
 */
export function processPlayerRegionInformation(
  playerData: DeedComplete[],
  resourcePrices: Prices,
  includeTaxes: boolean = true,
  includeTransferFee: boolean = true
): PlayerRegionDataType {
  const regionSummary = prepareSummary(
    playerData,
    includeTaxes,
    includeTransferFee
  );

  const { dec_net, total_dec } = computeNetValues(
    regionSummary,
    resourcePrices
  );
  const resource_net = computeResourceNetValue(regionSummary);

  const totalResourceCounts: Record<Resource, number> = {} as Record<
    Resource,
    number
  >;

  const totalResourceCountsIsConstruction: Record<Resource, number> =
    {} as Record<Resource, number>;

  playerData.forEach((deed: DeedComplete) => {
    const resource = deed.worksiteDetail?.token_symbol as Resource;
    if (resource) {
      totalResourceCounts[resource] = (totalResourceCounts[resource] || 0) + 1;
      if (deed.worksiteDetail?.is_construction) {
        totalResourceCountsIsConstruction[resource] =
          (totalResourceCountsIsConstruction[resource] || 0) + 1;
      }
    }
  });

  return {
    regionSummary: regionSummary,
    totals: {
      netAdjustedResource: resource_net,
      totalDEC: total_dec,
      dec: dec_net,
      resourceCounts: totalResourceCounts,
      resourceCountsIsConstruction: totalResourceCountsIsConstruction,
    },
  };
}

/**
 * Tax income of the player's Keeps/Castles, from the region-wide deed set
 * (server DB data — see `getPlayerTaxData`).
 */
export function processPlayerTaxIncome(
  playerData: DeedComplete[],
  allData: DeedComplete[],
  resourcePrices: Prices
): RegionTaxSummary[] {
  const results = [];
  for (const deed of playerData) {
    const capture_rate = deed.worksiteDetail?.captured_tax_rate ?? 0;
    const worksiteType = deed.worksiteDetail?.worksite_type;
    const regionUid = deed.region_uid!;
    let groupData = [];

    if (worksiteType === "KEEP") {
      const tractNumber = deed.tract_number ?? 0;
      const regionNumber = deed.region_number ?? 0;
      groupData = filterDeeds(allData, {
        filter_regions: [regionNumber],
        filter_tracts: [tractNumber],
      });
    } else if (worksiteType === "CASTLE") {
      const regionNumber = deed.region_number ?? 0;
      groupData = filterDeeds(allData, { filter_regions: [regionNumber] });
    } else {
      continue;
    }

    const resourceMap: Record<string, number> = {};

    for (const d of groupData) {
      const ws = d.worksiteDetail;
      if (ws && ws.token_symbol && typeof ws.rewards_per_hour === "number") {
        resourceMap[ws.token_symbol] =
          (resourceMap[ws.token_symbol] ?? 0) + ws.rewards_per_hour;
      }
    }

    let total_tax_dec = 0;

    const resources = Object.entries(resourceMap).map(
      ([token, total_rewards_per_hour]) => {
        const total_tax = total_rewards_per_hour * TAX_RATE;
        const captured = total_tax * capture_rate;
        const dec = resourcePrices[token] * captured;
        total_tax_dec += dec || 0;
        return { token, total_rewards_per_hour, total_tax, captured, dec };
      }
    );

    results.push({
      region_uid: regionUid,
      tract_number: deed.tract_number!,
      type: worksiteType,
      total_tax_dec: total_tax_dec,
      capture_rate: capture_rate,
      resources: resources,
    });
  }
  return results;
}
