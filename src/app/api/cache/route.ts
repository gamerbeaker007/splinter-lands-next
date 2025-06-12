import { getUniquePlayerCountFromBlob as getUniquePlayerCountDeeds } from "@/lib/api/internal/deed-data";
import { getLastUpdate } from "@/lib/cache/utils";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [uniquePlayers, lastUpdate] = await Promise.all([
      getUniquePlayerCountDeeds(true),
      getLastUpdate(),
      // otherCacheRefreshers()
    ]);

    return NextResponse.json({
      status: "ok",
      uniquePlayers,
      lastUpdate,
    });
  } catch (e) {
    console.error("Error refreshing caches:", e);
    return NextResponse.json(
      { status: "Error refreshing caches" },
      { status: 501 },
    );
  }
}
