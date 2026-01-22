import { getCachedRegionDataSSR } from "@/lib/backend/api/internal/deed-data";
import { getLastUpdate } from "@/lib/backend/cache/utils";
import logger from "@/lib/backend/log/logger.server";
import { DeedComplete } from "@/types/deed";
import { NextResponse } from "next/server";

/**
 * Calculate total staked DEC across all deeds
 * Only counts once per unique region-player combination
 */
function calculateTotalStakedDEC(deeds: DeedComplete[]): number {
  const seenPairs = new Set<string>();
  let totalDecStaked = 0;

  for (const deed of deeds) {
    const player = deed.player;
    const regionUid = deed.region_uid;
    const staking = deed.stakingDetail;

    if (!player || !regionUid || !staking) {
      continue;
    }

    const key = `${regionUid}-${player}`;

    // Only add DEC staked once per region-player combination
    if (!seenPairs.has(key)) {
      totalDecStaked += staking.total_dec_staked ?? 0;
      seenPairs.add(key);
    }
  }

  return totalDecStaked;
}

/**
 * GET /api/v1/total-staked-dec
 *
 * Returns the total amount of DEC staked across all deeds in the system.
 * DEC is counted once per unique region-player combination to avoid double counting.
 *
 * @returns {Object} JSON response with total staked DEC
 * @property {number} data.totalStakedDEC - Total DEC staked
 * @property {number} data.deedsAnalyzed - Number of deeds analyzed
 * @property {string} data.lastUpdated - Timestamp of the last update
 * @property {Object} meta - Metadata about the API response
 * @property {string} meta.apiVersion - Version of the API
 * @throws {Error} If there is an issue fetching or calculating the data
 *
 */
export async function GET() {
  try {
    logger.info("API v1: Fetching total staked DEC");

    // Fetch all deed data
    const deeds = await getCachedRegionDataSSR();
    const date = await getLastUpdate();

    // Calculate total staked DEC
    const totalStakedDEC = calculateTotalStakedDEC(deeds);

    // Return formatted response
    return NextResponse.json(
      {
        data: {
          totalStakedDEC,
          deedsAnalyzed: deeds.length,
          lastUpdated: date.toISOString(),
        },
        meta: {
          apiVersion: "1.0",
        },
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          // Data updates daily at 1:00 AM
          // Cache for 6 hours, allow stale for 1 hour while revalidating
          "Cache-Control":
            "public, max-age=21600, s-maxage=21600, stale-while-revalidate=3600",
          // Allow external sites to call this API
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET",
        },
      }
    );
  } catch (error) {
    logger.error("API v1: Error fetching total staked DEC", error);

    return NextResponse.json(
      {
        error: {
          message: "Failed to calculate total staked DEC",
          code: "INTERNAL_SERVER_ERROR",
        },
        meta: {
          apiVersion: "1.0",
        },
      },
      { status: 500 }
    );
  }
}
