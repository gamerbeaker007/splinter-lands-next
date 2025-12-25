import {
  getAllActiveData,
  invalidateActiveDataCache,
} from "@/lib/backend/api/internal/active-data";
import {
  getCachedRegionDataSSR,
  invalidateDeedCache,
} from "@/lib/backend/api/internal/deed-data";
import {
  getPlayerProductionData,
  invalidatePlayerProductionDataCache,
} from "@/lib/backend/api/internal/player-production-data";
import {
  getPlayerTradeHubPositionData,
  invalidatePlayerTradeHubDataCache,
} from "@/lib/backend/api/internal/player-trade-hub-data";
import {
  getAllResourceSupplyData,
  invalidateResourceSupplyDataCache,
} from "@/lib/backend/api/internal/resource-supply-data";
import {
  getAllResourceTrackingdata,
  invalidateResourceTrackingDataCache,
} from "@/lib/backend/api/internal/resource-tracking-data";
import {
  getAllTradeHubData,
  invalidateTradeHubDataCache,
} from "@/lib/backend/api/internal/trade-hub-data";
import logger from "@/lib/frontend/log/logger.client";
import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

/**
 * Combined API endpoint to invalidate and warm cache
 * Call this single endpoint after your data_inject script completes
 *
 * Usage:
 * POST /api/cache/refresh
 * Headers: Authorization: Bearer YOUR_TOKEN
 */
export async function POST(request: NextRequest) {
  try {
    // Optionally verify request is authenticated/authorized
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.CACHE_INVALIDATE_TOKEN;

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const startTime = Date.now();

    // Step 1: Invalidate all in-memory caches
    logger.info("🗑️ Invalidating all caches...");
    await Promise.all([
      invalidateDeedCache(),
      invalidateActiveDataCache(),
      invalidatePlayerProductionDataCache(),
      invalidateResourceSupplyDataCache(),
      invalidateResourceTrackingDataCache(),
      invalidateTradeHubDataCache(),
      invalidatePlayerTradeHubDataCache(),
    ]);

    // Step 2: Invalidate Next.js cache tags for processed data
    revalidateTag("daily", "default");

    // Step 3: Warm up all caches by fetching fresh data
    logger.info("🔥 Warming up all caches...");
    const [
      deeds,
      activeData,
      playerProduction,
      resourceSupply,
      resourceTracking,
      tradeHub,
      playerTradeHub,
    ] = await Promise.all([
      getCachedRegionDataSSR(true),
      getAllActiveData(true),
      getPlayerProductionData(true),
      getAllResourceSupplyData(true),
      getAllResourceTrackingdata(true),
      getAllTradeHubData(true),
      getPlayerTradeHubPositionData(true),
    ]);

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: "All caches invalidated and warmed successfully",
      steps: {
        invalidated: true,
        warmed: true,
      },
      recordCounts: {
        deeds: deeds.length,
        activeData: activeData.length,
        playerProduction: playerProduction.length,
        resourceSupply: resourceSupply.length,
        resourceTracking: resourceTracking.length,
        tradeHub: tradeHub.length,
        playerTradeHub: playerTradeHub.length,
      },
      durationMs: duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Cache refresh error:", error);
    return NextResponse.json(
      {
        error: "Failed to refresh cache",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
