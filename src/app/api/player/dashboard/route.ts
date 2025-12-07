import { logError } from "@/lib/backend/log/logUtils";
import { NextResponse } from "next/server";
import { getCachedPlayerOverviewData } from "@/lib/backend/services/playerService";

export async function POST(req: Request) {
  try {
    const { player, force } = await req.json();
    const result = await getCachedPlayerOverviewData(player, force);
    return NextResponse.json(result);
  } catch (err) {
    logError("Failed to load player dashboard data", err);
    return NextResponse.json(
      { error: "Failed to load player dashboard data" },
      { status: 501 }
    );
  }
}
