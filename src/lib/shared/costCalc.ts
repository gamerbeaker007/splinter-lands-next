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
 * Returns a record mapping resource names to their costs per hour.
 *
 * When grainReqPerHour is provided (backend callers with deed data), it is used
 * directly for the GRAIN cost — this correctly handles TAX plots (value = 0)
 * and plots with a food discount already baked in by the API.
 *
 * When grainReqPerHour is omitted (frontend planner), the formula fallback is used:
 *   basePP * DEFAULT_GRAIN_COST * siteEfficiency * (1 + rationing)
 * where rationing is grain_food_discount stored as a negative value (e.g. -0.1 = 10% off).
 *
 * @param basePP
 * @param siteEfficiency
 * @param isConstruction
 * @param rationing grain_food_discount (negative = discount, used only in formula fallback)
 * @param recipe
 * @param grainReqPerHour pre-computed grain per hour from the API (worksiteDetail)
 */
export function calcCostsV2(
  basePP: number,
  siteEfficiency: number,
  isConstruction: boolean,
  rationing: number,
  recipe?: ResourceRecipeItem[],
  grainReqPerHour?: number
): Record<Resource, number> {
  const costs: Record<string, number> = {};

  costs.GRAIN =
    grainReqPerHour ??
    basePP * DEFAULT_GRAIN_COST * siteEfficiency * (1 + rationing);

  // When under construction, only GRAIN is consumed
  if (isConstruction) {
    return costs as Record<Resource, number>;
  }

  // Calculate costs for other resources based on recipe
  if (recipe) {
    for (const item of recipe) {
      costs[item.symbol] = basePP * item.qty * siteEfficiency;
    }
  }

  return costs;
}

/**
 * Same as calcCostsV2 but enriches each resource cost with DEC buy/sell prices.
 *
 * Backend callers should pass grainReqPerHour from worksiteDetail to bypass the
 * formula and correctly handle TAX plots and food discounts.
 * The frontend planner omits grainReqPerHour and passes rationing (consumeGrainDiscount)
 * to use the formula fallback.
 */
export function calcCostsWithDEC(
  basePP: number,
  prices: Record<string, number>,
  siteEfficiency: number,
  recipe: ResourceRecipeItem[],
  isConstruction: boolean,
  rationing?: number,
  grainReqPerHour?: number
): ResourceWithDEC[] {
  const costs = calcCostsV2(
    basePP,
    siteEfficiency,
    isConstruction,
    rationing ?? 0,
    recipe,
    grainReqPerHour
  );

  return Object.entries(costs).map(([resource, amount]) => ({
    resource: resource as Resource,
    amount,
    buyPriceDEC: calcDirectDECPrice("buy", amount, prices[resource] ?? 0),
    sellPriceDEC: calcDirectDECPrice("sell", amount, prices[resource] ?? 0),
  }));
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
