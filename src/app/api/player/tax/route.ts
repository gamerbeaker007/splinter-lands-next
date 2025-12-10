import { getCachedRegionDataSSR } from "@/lib/backend/api/internal/deed-data";
import { logError } from "@/lib/backend/log/logUtils";
import { processPlayerTaxIncome } from "@/lib/backend/services/playerService";
import { getCachedResourcePrices } from "@/lib/backend/services/resourceService";
import { filterDeeds } from "@/lib/filters";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { player } = await req.json();
    const allData = await getCachedRegionDataSSR();
    const resourcePrices = await getCachedResourcePrices();
    const playerData = filterDeeds(allData, {
      filter_players: [player],
      filter_worksites: ["KEEP", "CASTLE"],
    });

    const result =
      playerData.length > 0
        ? processPlayerTaxIncome(playerData, allData, resourcePrices)
        : null;
    return NextResponse.json(result);
  } catch (err) {
    logError("Failed to load player tax data", err);
    return NextResponse.json(
      { error: "Failed to load player tax data" },
      { status: 501 }
    );
  }
}
