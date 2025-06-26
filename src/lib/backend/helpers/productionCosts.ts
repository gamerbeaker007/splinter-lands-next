import {
  NATURAL_RESOURCES,
  PRODUCING_RESOURCES,
} from "@/scripts/lib/utils/statics";
import { RegionSummary } from "@/types/resource";

const TAX_RATE = 0.9; // 10% tax rate reduced from production
const TRANSFER_FEE = 1.1; // 10% transfer fee added for resources with a deficit in the region

type CostKey =
  | "cost_per_h_grain"
  | "cost_per_h_wood"
  | "cost_per_h_stone"
  | "cost_per_h_iron";

function isCostKey(key: string): key is CostKey {
  return [
    "cost_per_h_grain",
    "cost_per_h_wood",
    "cost_per_h_stone",
    "cost_per_h_iron",
  ].includes(key);
}

/**
 * Summarize per region the produce per hour and cost per hour
 * @param data
 */
function getRegionSummary(data: RegionSummary[]) {
  const summaryMap: Record<string, RegionSummary> = {};

  for (const row of data) {
    const region = row.region_uid;
    const symbol = row.token_symbol as string;
    const symbolLower = symbol.toLowerCase();
    const producedCol = `prod_per_h_${symbolLower}`;

    if (symbol != "TAX") {
      if (!summaryMap[region]) {
        summaryMap[region] = {
          region_uid: region,
        };
      }

      // Sum the total produced rewards
      summaryMap[region][producedCol] =
        ((summaryMap[region][producedCol] as number) || 0) +
        (row.rewards_per_hour as number);

      // Count the amount of plots
      summaryMap[region][symbolLower] =
        ((summaryMap[region][symbolLower] as number) || 0) + 1;

      // Sum the cost per natural resource
      NATURAL_RESOURCES.forEach((res) => {
        const costCol = `cost_per_h_${res.toLowerCase()}`;
        const rawCost = isCostKey(costCol) ? row[costCol] : 0;
        summaryMap[region][costCol] =
          ((summaryMap[region][costCol] as number) || 0) +
          ((rawCost as number) || 0);
      });
    }
  }
  return summaryMap;
}

export function prepareSummary(
  data: RegionSummary[],
  includeTaxes: boolean,
  includeTransferFee: boolean,
): RegionSummary[] {
  const summaryMap = getRegionSummary(data);

  // Add missing resource columns and compute net + adjusted net
  const summaryArray = Object.values(summaryMap);

  for (const row of summaryArray) {
    for (const res of PRODUCING_RESOURCES) {
      const resource = res.toLowerCase();
      const producedKey = `prod_per_h_${resource}`;
      const costKey = `cost_per_h_${resource}`;
      const netKey = `net_${resource}`;
      const adjNetKey = `adj_net_${resource}`;

      //make sure the produce and cost column are defined before
      row[producedKey] = row[producedKey] || 0;
      row[costKey] = row[costKey] || 0;
      row[resource] = row[resource] || 0;

      // Apply taxes on the producing resources
      if (includeTaxes) {
        const producedKey = `prod_per_h_${resource}`;
        (row[producedKey] as number) *= TAX_RATE;
      }

      // Apply transfer fees (if applicable)
      // For research aura sps it's not possible to have a deficit also not possible to transfer between regions
      // When you have a deficit in a resource 10% to compensate for the potential transfer fee
      if (["RESEARCH", "AURA", "SPS"].includes(res)) {
        row[netKey] = row[producedKey];
        row[adjNetKey] = row[netKey];
      } else {
        (row[netKey] as number) =
          (row[producedKey] as number) - (row[costKey] as number);
        row[adjNetKey] = includeTransferFee
          ? adjustTransferWithFee(row[netKey] as number)
          : row[netKey];
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
