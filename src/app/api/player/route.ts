import { getPlayerData } from "@/lib/backend/api/internal/player-data";
import { logger } from "@/lib/backend/log/logger";
import { logError } from "@/lib/backend/log/logUtils";
import { DeedComplete } from "@/types/deed";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { filters, player } = await req.json();
    logger.info(`Retrieve player data: ${player}`);
    const result: DeedComplete[] = await getPlayerData(player, filters);

    if (!result)
      return NextResponse.json({ error: "No data found" }, { status: 404 });

    return NextResponse.json(result);
  } catch (err) {
    logError("Failed to load player data", err);
    return NextResponse.json(
      { error: "Failed to load plyaer data" },
      { status: 501 },
    );
  }
}
