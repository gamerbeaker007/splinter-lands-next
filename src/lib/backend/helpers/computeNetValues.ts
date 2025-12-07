import { Resource } from "@/constants/resource/resource";
import { PRODUCING_RESOURCES } from "@/lib/shared/statics";
import { Prices } from "@/types/price";
import { RegionSummary } from "@/types/resource";

export function computeNetValues(
  summary: RegionSummary[],
  unitPrices: Prices
): { dec_net: Record<Resource, number>; total_dec: number } {
  const dec_net: Record<string, number> = {};
  let total_dec = 0;

  for (const res of PRODUCING_RESOURCES) {
    const resource = res as Resource;

    const amount = summary.reduce(
      (acc, row) => acc + ((row.netAdjustedResource[resource] as number) || 0),
      0
    );

    const decValue = unitPrices[res] * amount;
    dec_net[resource] = decValue;
    total_dec += decValue;
  }

  return { dec_net, total_dec };
}

export function computeResourceNetValue(
  summary: RegionSummary[]
): Record<Resource, number> {
  const resource_net: Record<string, number> = {};

  for (const res of PRODUCING_RESOURCES) {
    const resource = res as Resource;

    resource_net[`${resource}`] = summary.reduce(
      (acc, row) => acc + ((row.netAdjustedResource[resource] as number) || 0),
      0
    );
  }

  return resource_net;
}
