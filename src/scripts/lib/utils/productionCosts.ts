import { getMidnightPotionPrice } from "@/lib/backend/api/spl/spl-land-api";
import {
  NATURAL_RESOURCES,
  PRODUCING_RESOURCES,
} from "@/scripts/lib/utils/statics";
import { SplPriceData } from "@/types/price";
import { RegionSummary, RegionTrackingRow } from "../types/resource";

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

export async function getPrice(
  metrics: [{ token_symbol: string; dec_price: number }],
  prices: SplPriceData,
  token: string,
  amount: number,
): Promise<number> {
  if (token === "RESEARCH") {
    return 0;
  }

  if (token === "SPS") {
    const usdValue = amount * prices.sps;
    const decTotal = usdValue / prices.dec;
    return decTotal;
  }

  if (token === "AURA") {
    const usdPrice = await getMidnightPotionPrice(); // this should return a number
    if (usdPrice) {
      const potionUSD = (amount / 40) * usdPrice;
      const decTotal = potionUSD / prices.dec;
      return decTotal;
    } else {
      return 0;
    }
  }

  const matchingMetric = metrics.find((m) => m.token_symbol === token);
  if (!matchingMetric || !matchingMetric.dec_price) {
    throw new Error(`Missing dec_price for token ${token}`);
  }

  return amount / matchingMetric.dec_price;
}

function getRegionSummary(data: RegionTrackingRow[]) {
  const summaryMap: Record<string, RegionSummary> = {};

  for (const row of data) {
    const region = row.region_uid;
    const symbol = row.token_symbol;
    const symbolLower = symbol.toLowerCase();
    const producedCol = `prod_per_h_${symbolLower}`;

    if (!summaryMap[region]) {
      summaryMap[region] = {
        region_uid: region,
      };
    }

    summaryMap[region][producedCol] =
      ((summaryMap[region][producedCol] as number) || 0) + row.rewards_per_hour;

    NATURAL_RESOURCES.forEach((res) => {
      const costCol = `cost_per_h_${res.toLowerCase()}`;
      const rawCost = isCostKey(costCol) ? row[costCol] : 0;
      summaryMap[region][costCol] =
        ((summaryMap[region][costCol] as number) || 0) + (rawCost || 0);
    });
  }
  return summaryMap;
}

export function prepareSummary(
  data: RegionTrackingRow[],
  includeTaxes: boolean,
  includeTransferFee: boolean,
) {
  const summaryMap = getRegionSummary(data);

  // Add missing resource columns and compute net + adjusted net
  const summaryArray = Object.values(summaryMap);

  for (const row of summaryArray) {
    for (const res of PRODUCING_RESOURCES) {
      const producedKey = `prod_per_h_${res.toLowerCase()}`;
      const costKey = `cost_per_h_${res.toLowerCase()}`;
      const netKey = `net_${res.toLowerCase()}`;
      const adjNetKey = `adj_net_${res.toLowerCase()}`;

      row[producedKey] = row[producedKey] || 0;
      row[costKey] = row[costKey] || 0;

      // Apply taxes if enabled
      if (includeTaxes) {
        const producedKey = `prod_per_h_${res.toLowerCase()}`;
        (row[producedKey] as number) *= TAX_RATE;
      }

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
