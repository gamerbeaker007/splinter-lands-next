import { getLatestResourceSupplyEntries } from "@/lib/backend/api/internal/resource-supply-data";
import { getLatestResourceTrackingEntries } from "@/lib/backend/api/internal/resource-tracking-data";
import { getLatestTradeHubEntries } from "@/lib/backend/api/internal/trade-hub-data";
import { computeResourceSupplyOverview } from "@/lib/backend/helpers/resourceSupplyOverview";
import { logError } from "@/lib/backend/log/logUtils";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supply = (await getLatestResourceSupplyEntries()) ?? [];
    const resourceTracking = (await getLatestResourceTrackingEntries()) ?? [];
    const tradeHubSupply = (await getLatestTradeHubEntries()) ?? [];

    const date = new Date(supply[0].date).toISOString().split("T")[0];
    const output1 = computeResourceSupplyOverview(
      date,
      supply,
      resourceTracking,
      tradeHubSupply
    );

    return NextResponse.json(output1, { status: 200 });
  } catch (err) {
    logError("Failed to load data", err);
    return NextResponse.json({ error: "Failed to load data" }, { status: 501 });
  }
}
