import {
  ResourceHubMetrics,
  ResourceSupply,
  ResourceTracking,
} from "@/generated/prisma";
import {
  DEFAULT_ORDER_RESOURCES,
  PRODUCING_RESOURCES,
} from "@/lib/shared/statics";
import { ResourceSupplyOverview } from "@/types/resourceSupplyOverview";

export function computeResourceSupplyOverview(
  date: string,
  supply: ResourceSupply[],
  resourceTracking: ResourceTracking[],
  tradeHubSupply: ResourceHubMetrics[],
): ResourceSupplyOverview {
  const resourceMap: ResourceSupplyOverview["resource"] = {};
  const supplyMap = new Map(
    supply.map((s) => [s.resource, Number(s.total_supply)]),
  );
  const tradeHubSupplyMap = new Map(
    tradeHubSupply.map((s) => [s.token_symbol, Number(s.resource_quantity)]),
  );

  for (const rt of resourceTracking) {
    const token = rt.token_symbol;

    const daily_production = (rt.rewards_per_hour ?? 0) * 24;
    const consumes = {
      grain: (rt.cost_per_h_grain ?? 0) * 24,
      wood: (rt.cost_per_h_wood ?? 0) * 24,
      stone: (rt.cost_per_h_stone ?? 0) * 24,
      iron: (rt.cost_per_h_iron ?? 0) * 24,
    };

    // Set overview for all producing resources (will exclude TAX)
    if (PRODUCING_RESOURCES.includes(token)) {
      resourceMap[token] = {
        supply: supplyMap.get(token) || 0,
        trade_hub_supply: tradeHubSupplyMap.get(token) || 0,
        daily_production,
        daily_consume: 0, // will be filed later
        consumes,
      };
    }
  }

  // Now determine the daily consume of the resources
  for (const token of Object.keys(resourceMap)) {
    let totalConsumed = 0;

    for (const other of Object.values(resourceMap)) {
      totalConsumed +=
        other.consumes[token.toLowerCase() as keyof typeof other.consumes] ?? 0;
    }

    resourceMap[token].daily_consume = totalConsumed;
  }

  const orderedResourceMap: ResourceSupplyOverview["resource"] = {};
  for (const res of DEFAULT_ORDER_RESOURCES) {
    if (resourceMap[res]) {
      orderedResourceMap[res] = resourceMap[res];
    }
  }

  const output: ResourceSupplyOverview = {
    date,
    resource: orderedResourceMap,
  };
  return output;
}
