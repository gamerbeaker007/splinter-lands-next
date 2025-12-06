import { getPlayerData } from "@/lib/backend/api/internal/player-data";
import { logError } from "@/lib/backend/log/logUtils";
import { DeedComplete } from "@/types/deed";
import { NextResponse } from "next/server";
import { processPlayerRegionInformation } from "@/lib/backend/services/playerService";

export async function POST(req: Request) {
  try {
    const { filters, player, force } = await req.json();

    const playerData: DeedComplete[] = await getPlayerData(
      player,
      filters,
      force
    );

    if (!playerData)
      return NextResponse.json({ error: "No data found" }, { status: 404 });

    const retVal = await processPlayerRegionInformation(playerData);

    return NextResponse.json(retVal);
  } catch (err) {
    logError("Failed to load player data", err);
    return NextResponse.json(
      { error: "Failed to load player data" },
      { status: 501 }
    );
  }
}
