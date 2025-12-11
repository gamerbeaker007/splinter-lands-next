import { getLastUpdate } from "@/lib/backend/cache/utils";
import { logError } from "@/lib/backend/log/logUtils";
import { getUniquePlayerCountFromBlob } from "@/lib/backend/services/regionService";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [uniquePlayers, lastUpdate] = await Promise.all([
      getUniquePlayerCountFromBlob(),
      getLastUpdate(),
      // otherCacheRefreshers()
    ]);

    return NextResponse.json({
      status: "ok",
      uniquePlayers,
      lastUpdate,
    });
  } catch (e) {
    logError("Error refreshing caches:", e);
    return NextResponse.json(
      { status: "Error refreshing caches" },
      { status: 501 }
    );
  }
}
