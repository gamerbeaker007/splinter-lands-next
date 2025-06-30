import { getAllResourceSupplyData } from "@/lib/backend/api/internal/resource-supply-data";
import { getAllResourceTrackingdata } from "@/lib/backend/api/internal/resource-tracking-data";
import { getAllTradeHubData } from "@/lib/backend/api/internal/trade-hub-data";
import { computeResourceSupplyOverview } from "@/lib/backend/helpers/resourceSupplyOverview";
import { logError } from "@/lib/backend/log/logUtils";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supply = (await getAllResourceSupplyData()) ?? [];
    const resourceTracking = (await getAllResourceTrackingdata()) ?? [];
    const tradeHubSupply = (await getAllTradeHubData()) ?? [];

    const uniqueDates = [
      ...new Set(
        supply.map((s) => new Date(s.date).toISOString().split("T")[0]),
      ),
    ].sort();

    const result = [];

    for (const date of uniqueDates) {
      const filteredSupply = supply.filter(
        (s) => new Date(s.date).toISOString().split("T")[0] === date,
      );
      const filteredTracking = resourceTracking.filter(
        (r) => new Date(r.date).toISOString().split("T")[0] === date,
      );
      const filteredTradeHub = tradeHubSupply.filter(
        (t) => new Date(t.date).toISOString().split("T")[0] === date,
      );

      const overview = computeResourceSupplyOverview(
        date,
        filteredSupply,
        filteredTracking,
        filteredTradeHub,
      );

      result.push(overview);
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    logError("Failed to load data", err);
    return NextResponse.json({ error: "Failed to load data" }, { status: 501 });
  }
}
