"use server";

import { fetchLandResourcesPools } from "@/lib/backend/api/spl/spl-land-api";
import { SplLandPool } from "@/types/spl/landPools";
import { cacheLife } from "next/cache";

/**
 * Get the current liquidity pool data with caching.
 * Uses daily cache (1 day + 1 hour TTL) since pool data doesn't change frequently.
 */

export async function getLandLiquidityPools(): Promise<{
  data: SplLandPool[];
  timeStamp: string;
}> {
  "use cache";
  cacheLife("seconds");

  const data = await fetchLandResourcesPools();
  return { data, timeStamp: Date.now().toString() };
}
