import { PRODUCING_RESOURCES } from "@/scripts/lib/utils/statics";
import { RegionSummary } from "@/types/resource";

export function computeNetValues(
  summary: RegionSummary[],
  unitPrices: Record<string, number>,
): { dec_net: Record<string, number>; total_dec: number } {
  const dec_net: Record<string, number> = {};
  let total_dec = 0;

  for (const key of PRODUCING_RESOURCES) {
    const k = key.toLowerCase();
    const adjNetKey = `adj_net_${k}`;

    const amount = summary.reduce(
      (acc, row) => acc + ((row[adjNetKey] as number) || 0),
      0,
    );

    const decValue = unitPrices[k] * amount;
    dec_net[`dec_${k}`] = decValue;
    total_dec += decValue;
  }

  return { dec_net, total_dec };
}

export function computeResourceNetValue(
  summary: RegionSummary[],
): Record<string, number> {
  const resource_net: Record<string, number> = {};

  for (const key of PRODUCING_RESOURCES) {
    const k = key.toLowerCase();
    const adjNetKey = `adj_net_${k}`;

    resource_net[`${k}`] = summary.reduce(
      (acc, row) => acc + ((row[adjNetKey] as number) || 0),
      0,
    );
  }

  return resource_net;
}
