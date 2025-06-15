import { getLastUpdate } from "@/lib/cache/utils";
import { getUniquePlayerCountFromBlob } from "@/lib/services/regionService";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [uniquePlayers, lastUpdate] = await Promise.all([
      getUniquePlayerCountFromBlob(true),
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
