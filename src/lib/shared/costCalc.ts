import {
  CONSUME_RATES,
  CONSUMES_ONLY_GRAIN,
  MULTIPLE_CONSUMING_RESOURCES,
  NATURAL_RESOURCES,
} from "@/scripts/lib/utils/statics";

type CostResult = {
  cost_per_h_grain: number;
  cost_per_h_wood: number;
  cost_per_h_stone: number;
  cost_per_h_iron: number;
};

export function calcCosts(
  token_symbol: string,
  total_base_pp_after_cap: number,
): CostResult {
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
