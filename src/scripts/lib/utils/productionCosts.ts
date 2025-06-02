import {CONSUME_RATES, CONSUMES_ONLY_GRAIN, MULTIPLE_CONSUMING_RESOURCES, NATURAL_RESOURCES, PRODUCING_RESOURCES} from "@/scripts/lib/utils/statics";
import {getMidnightPotionPrice} from "@/lib/api/spl/splLandAPI";
import { RegionSummary, RegionTrackingRow } from "../types/resource";
import { SplPriceData } from "@/types/price";

const TAX_RATE = 0.9  // 10% tax rate

type CostResult = {
    cost_per_h_grain: number;
    cost_per_h_wood: number;
    cost_per_h_stone: number;
    cost_per_h_iron: number;
  };

  type CostKey = 'cost_per_h_grain' | 'cost_per_h_wood' | 'cost_per_h_stone' | 'cost_per_h_iron';

function isCostKey(key: string): key is CostKey {
  return ['cost_per_h_grain', 'cost_per_h_wood', 'cost_per_h_stone', 'cost_per_h_iron'].includes(key);
}


export function calcCosts(token_symbol: string, total_base_pp_after_cap: number): CostResult {
    const costs: CostResult = {
        cost_per_h_grain: 0,
        cost_per_h_wood: 0,
        cost_per_h_stone: 0,
        cost_per_h_iron: 0,
    };

    if (CONSUMES_ONLY_GRAIN.has(token_symbol)) {
        costs.cost_per_h_grain = total_base_pp_after_cap * CONSUME_RATES.GRAIN;
    } else if (MULTIPLE_CONSUMING_RESOURCES.has(token_symbol)) {
        for (const res of NATURAL_RESOURCES) {
            const key = `cost_per_h_${res.toLowerCase()}` as keyof CostResult;
            costs[key] = total_base_pp_after_cap * CONSUME_RATES[res];
        }
    }

    return costs;
}


export async function getPrice(
    metrics: [{token_symbol: string, dec_price: number}] ,
    prices: SplPriceData,
    token: string,
    amount: number
): Promise<number> {
    if (token === 'RESEARCH') {
        return 0;
    }

    if (token === 'SPS') {
        const usdValue = amount * prices.sps;
        const decTotal = usdValue / prices.dec;
        return decTotal;
    }

    if (token === 'AURA') {
        const usdPrice = await getMidnightPotionPrice(); // this should return a number
        if (usdPrice) {
            const potionUSD = (amount / 40) * usdPrice;
            const decTotal = potionUSD / prices.dec;
            return decTotal;
        } else {
            return 0;
        }
    }

    const matchingMetric = metrics.find(m => m.token_symbol === token);
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
            (summaryMap[region][producedCol] as number || 0) + row.rewards_per_hour;

        NATURAL_RESOURCES.forEach(res => {
            const costCol = `cost_per_h_${res.toLowerCase()}`;
            const rawCost = isCostKey(costCol) ? row[costCol] : 0;
            summaryMap[region][costCol] =
                (summaryMap[region][costCol] as number || 0) + (rawCost || 0);

        })

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

            if (["RESEARCH", "AURA", "SPS"].includes(res)) {
                row[netKey] = row[producedKey];
                row[adjNetKey] = row[netKey];
            } else {
                (row[netKey] as number) = (row[producedKey] as number) - (row[costKey] as number);
                row[adjNetKey] = includeTransferFee ? adjustTransferWithFee(row[netKey] as number) : row[netKey];
            }
        }

        // Apply taxes if enabled
        if (includeTaxes) {
            for (const res of PRODUCING_RESOURCES) {
                const producedKey = `prod_per_h_${res.toLowerCase()}`;
                (row[producedKey] as number) *= TAX_RATE;
            }
        }
    }

    return summaryArray;
}

function adjustTransferWithFee(value: number): number {
    if (value < 0){
        return value * 1.1
    } else{
        return value
    }
}
