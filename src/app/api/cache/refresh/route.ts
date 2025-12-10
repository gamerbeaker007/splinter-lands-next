import {
  getCachedRegionDataSSR,
  invalidateDeedCache,
} from "@/lib/backend/api/internal/deed-data-v2";
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

    // Step 1: Invalidate the in-memory cache
    await invalidateDeedCache();

    // Step 2: Invalidate Next.js cache tags for processed data
    revalidateTag("daily", "default");

    // Step 3: Warm up the cache by fetching fresh data
    const data = await getCachedRegionDataSSR();

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: "Cache invalidated and warmed successfully",
      steps: {
        invalidated: true,
        warmed: true,
      },
      recordCount: data.length,
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
