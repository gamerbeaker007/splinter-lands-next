"use server";

import {
  getAllResourceSupplyData,
  getLatestResourceSupplyEntries,
} from "@/lib/backend/api/internal/resource-supply-data";
import {
  getAllResourceTrackingdata,
  getLatestResourceTrackingEntries,
} from "@/lib/backend/api/internal/resource-tracking-data";
import {
  getAllTradeHubData,
  getLatestTradeHubEntries,
} from "@/lib/backend/api/internal/trade-hub-data";
import { computeResourceSupplyOverview } from "@/lib/backend/helpers/resourceSupplyOverview";
import { ResourceSupplyOverview } from "@/types/resourceSupplyOverview";

/**
 * Get all resource supply data.
 */
export async function getAllResourceSupply(): Promise<
  ResourceSupplyOverview[]
> {
  const supply = (await getAllResourceSupplyData()) ?? [];
  const resourceTracking = (await getAllResourceTrackingdata()) ?? [];
  const tradeHubSupply = (await getAllTradeHubData()) ?? [];

  const uniqueDates = [
    ...new Set(supply.map((s) => new Date(s.date).toISOString().split("T")[0])),
  ].sort();

  const result = [];

  for (const date of uniqueDates) {
    const filteredSupply = supply.filter(
      (s) => new Date(s.date).toISOString().split("T")[0] === date
    );
    const filteredTracking = resourceTracking.filter(
      (r) => new Date(r.date).toISOString().split("T")[0] === date
    );
    const filteredTradeHub = tradeHubSupply.filter(
      (t) => new Date(t.date).toISOString().split("T")[0] === date
    );

    const overview = computeResourceSupplyOverview(
      date,
      filteredSupply,
      filteredTracking,
      filteredTradeHub
    );

    result.push(overview);
  }

  return result;
}

/**
 * Get latest resource supply data.
 */
export async function getLatestResourceSupply(): Promise<ResourceSupplyOverview> {
  const supply = (await getLatestResourceSupplyEntries()) ?? [];
  const resourceTracking = (await getLatestResourceTrackingEntries()) ?? [];
  const tradeHubSupply = (await getLatestTradeHubEntries()) ?? [];

  const date = new Date(supply[0].date).toISOString().split("T")[0];
  const output = computeResourceSupplyOverview(
    date,
    supply,
    resourceTracking,
    tradeHubSupply
  );

  return output;
}
