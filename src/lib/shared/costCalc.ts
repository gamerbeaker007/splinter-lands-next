import { Resource } from "@/constants/resource/resource";
import {
  CONSUME_RATES,
  CONSUMES_ONLY_GRAIN,
  MULTIPLE_CONSUMING_RESOURCES,
  NATURAL_RESOURCES,
  PRODUCE_RATES,
  TRADE_HUB_FEE,
} from "@/lib/shared/statics";
import { Mode } from "@/types/mode";
import { Prices } from "@/types/price";
import { ResourceWithDEC } from "@/types/productionInfo";

type CostResult = {
  cost_per_h_grain: number;
  cost_per_h_wood: number;
  cost_per_h_stone: number;
  cost_per_h_iron: number;
};

/**
 * @deprecated Use calcConsumeCosts for new implementation
 * This return a CostResult cost_per_h_<resource> this is not easy expandable
 *
 * New method also includes the DEC conversion directly
 * @param token_symbol
 * @param total_base_pp_after_cap
 * @param siteEfficiency
 */
export function calcCosts(
  token_symbol: string,
  total_base_pp_after_cap: number,
  siteEfficiency: number,
): CostResult {
  const costs: CostResult = {
    cost_per_h_grain: 0,
    cost_per_h_wood: 0,
    cost_per_h_stone: 0,
    cost_per_h_iron: 0,
  };

  if (CONSUMES_ONLY_GRAIN.has(token_symbol)) {
    costs.cost_per_h_grain =
      total_base_pp_after_cap * CONSUME_RATES.GRAIN * siteEfficiency;
  } else if (MULTIPLE_CONSUMING_RESOURCES.has(token_symbol)) {
    for (const res of NATURAL_RESOURCES) {
      const key = `cost_per_h_${res.toLowerCase()}` as keyof CostResult;
      costs[key] =
        total_base_pp_after_cap * CONSUME_RATES[res] * siteEfficiency;
    }
  }

  return costs;
}

export function calcConsumeCosts(
  token_symbol: string,
  total_base_pp_after_cap: number,
  prices: Record<string, number>,
  siteEfficiency: number,
): ResourceWithDEC[] {
  if (CONSUMES_ONLY_GRAIN.has(token_symbol)) {
    const amount =
      total_base_pp_after_cap * CONSUME_RATES.GRAIN * siteEfficiency;
    return [
      {
        resource: "GRAIN",
        amount,
        buyPriceDEC: calcDirectDECPrice("buy", amount, prices["grain"] ?? 0),
        sellPriceDEC: calcDirectDECPrice("sell", amount, prices["grain"] ?? 0),
      },
    ];
  } else if (MULTIPLE_CONSUMING_RESOURCES.has(token_symbol)) {
    const retVal: ResourceWithDEC[] = [];
    for (const res of NATURAL_RESOURCES) {
      const amount =
        total_base_pp_after_cap * CONSUME_RATES[res] * siteEfficiency;
      retVal.push({
        resource: res as Resource,
        amount,
        buyPriceDEC: calcDirectDECPrice(
          "buy",
          amount,
          prices[res.toLowerCase()] ?? 0,
        ),
        sellPriceDEC: calcDirectDECPrice(
          "sell",
          amount,
          prices[res.toLowerCase()] ?? 0,
        ),
      });
    }
    return retVal;
  }

  return [];
}

export function calcProduction(
  resource: Resource,
  total_harvest_pp: number,
  prices: Record<string, number>,
  siteEfficiency: number,
  spsRatio?: number,
): ResourceWithDEC {
  const rate =
    resource === "SPS"
      ? Number.isFinite(spsRatio)
        ? (spsRatio as number)
        : 0 // use spsRatio for SPS
      : PRODUCE_RATES[resource]; // static for others

  const amount = total_harvest_pp * rate * siteEfficiency;
  return {
    resource,
    amount,
    buyPriceDEC: calcDirectDECPrice(
      "buy",
      amount,
      prices[resource.toLowerCase()] ?? 0,
    ),
    sellPriceDEC: calcDirectDECPrice(
      "sell",
      amount,
      prices[resource.toLowerCase()] ?? 0,
    ),
  };
}

export function calcDECPrice(
  mode: Mode,
  resource: string,
  amount: number,
  prices: Prices,
): number {
  const price = prices[resource.toLowerCase()] ?? 0;
  return resource === "AURA"
    ? amount * price
    : calcDirectDECPrice(mode, amount, price);
}

function calcDirectDECPrice(
  mode: Mode,
  amount: number,
  decPrice: number,
): number {
  if (decPrice === 0) return 0;
  return mode === "buy"
    ? amount / ((1 / decPrice) * TRADE_HUB_FEE)
    : amount * (decPrice * TRADE_HUB_FEE);
}
