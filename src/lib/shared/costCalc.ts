import { Resource } from "@/constants/resource/resource";
import {
  DEFAULT_GRAIN_COST,
  PRODUCE_RATES,
  recipeMap,
  ResourceRecipeItem,
  TRADE_HUB_FEE,
} from "@/lib/shared/statics";
import { Mode } from "@/types/mode";
import { Prices } from "@/types/price";
import { ResourceWithDEC } from "@/types/productionInfo";

/**
 * This return a record that maps resource names to their costs per hour
 *
 * New method also includes the DEC conversion directly
 * @param resource
 * @param basePP
 * @param siteEfficiency
 * @param recipe
 */
export function calcCostsV2(
  basePP: number,
  siteEfficiency: number,
  recipe?: ResourceRecipeItem[]
): Record<Resource, number> {
  const costs: Record<string, number> = {};

  // Always include GRAIN cost
  costs.GRAIN = basePP * DEFAULT_GRAIN_COST * siteEfficiency;

  // Calculate costs for other resources based on recipe
  if (recipe) {
    for (const item of recipe) {
      costs[item.symbol] = basePP * item.qty * siteEfficiency;
    }
  }

  return costs;
}

export function calcConsumeCosts(
  total_base_pp_after_cap: number,
  prices: Record<string, number>,
  siteEfficiency: number,
  recipe: ResourceRecipeItem[],
  consumeGrainDiscount?: number
): ResourceWithDEC[] {
  const costs: ResourceWithDEC[] = [];

  // Apply discount if any
  const discount = consumeGrainDiscount ?? 0;

  // Always calculate GRAIN cost
  const grainAmount =
    total_base_pp_after_cap *
    DEFAULT_GRAIN_COST *
    siteEfficiency *
    (1 - discount);
  costs.push({
    resource: "GRAIN",
    amount: grainAmount,
    buyPriceDEC: calcDirectDECPrice("buy", grainAmount, prices["GRAIN"] ?? 0),
    sellPriceDEC: calcDirectDECPrice("sell", grainAmount, prices["GRAIN"] ?? 0),
  });

  if (recipe) {
    for (const item of recipe) {
      const res = item.symbol as Resource;

      // Note no discounts for non-grain resources possible at the moment
      const amount = total_base_pp_after_cap * item.qty * siteEfficiency;
      costs.push({
        resource: res,
        amount,
        buyPriceDEC: calcDirectDECPrice("buy", amount, prices[res] ?? 0),
        sellPriceDEC: calcDirectDECPrice("sell", amount, prices[res] ?? 0),
      });
    }
  }
  return costs;
}

export function calcProduction(
  resource: Resource,
  total_harvest_pp: number,
  prices: Record<string, number>,
  siteEfficiency: number,
  spsRatio?: number
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
    buyPriceDEC: calcDirectDECPrice("buy", amount, prices[resource] ?? 0),
    sellPriceDEC: calcDirectDECPrice("sell", amount, prices[resource] ?? 0),
  };
}

export function calcDECPrice(
  mode: Mode,
  resource: string,
  amount: number,
  prices: Prices
): number {
  const price = prices[resource] ?? 0;
  return resource === "AURA"
    ? amount * price
    : calcDirectDECPrice(mode, amount, price);
}

function calcDirectDECPrice(
  mode: Mode,
  amount: number,
  decPrice: number
): number {
  if (decPrice === 0) return 0;
  return mode === "buy"
    ? amount / ((1 / decPrice) * TRADE_HUB_FEE)
    : amount * (decPrice * TRADE_HUB_FEE);
}

export function determineRecipe(resource: string): ResourceRecipeItem[] {
  return recipeMap[resource] || [];
}
