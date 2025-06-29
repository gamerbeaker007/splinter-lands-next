import { getLatestResourceSupplyEntries } from "@/lib/backend/api/internal/resource-supply-data";
import { getLatestResourceTrackingEntries } from "@/lib/backend/api/internal/resource-tracking-data";
import { getLatestTradeHubEntries } from "@/lib/backend/api/internal/trade-hub-data";
import { logError } from "@/lib/backend/log/logUtils";
import { DEFAULT_ORDER_RESOURCES } from "@/scripts/lib/utils/statics";
import { ResourceSupplyOverview } from "@/types/resourceSupplyOverview";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supply = (await getLatestResourceSupplyEntries()) ?? [];
    const resourceTracking = (await getLatestResourceTrackingEntries()) ?? [];
    const tradeHubSupply = (await getLatestTradeHubEntries()) ?? [];

    const date = supply[0].date; // all dates are the same
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

      // Set overview for known resources
      if (supplyMap.has(token)) {
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
          other.consumes[token.toLowerCase() as keyof typeof other.consumes] ??
          0;
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

    return NextResponse.json(output, { status: 200 });
  } catch (err) {
    logError("Failed to load data", err);
    return NextResponse.json({ error: "Failed to load data" }, { status: 501 });
  }
}
