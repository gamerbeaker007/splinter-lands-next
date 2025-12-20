"use server";

import { PlayerTradeHubPosition } from "@/generated/prisma/browser";
import { fetchLandResourcesPools } from "@/lib/backend/api/spl/spl-land-api";
import { SplLandPool } from "@/types/spl/landPools";
import { cacheLife } from "next/cache";
import { getPlayerTradeHubPositionData } from "../../api/internal/player-trade-hub-data";

/**
 * Get the current liquidity pool data with caching.
 * Uses a cache life of seconds.
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

export type GroupedPlayerTradeHubPosition = {
  date: string | null;
  tokens: Record<string, PlayerTradeHubPosition[]>;
};

/**
 *
 * Get grouped player trade hub position data. from the database (cached data).
 *
 */
export async function getPlayerTradeHubPosition(
  force: boolean = false
): Promise<GroupedPlayerTradeHubPosition> {
  const data = await getPlayerTradeHubPositionData(force);

  const result = groupByToken(data);
  result.date = getDate(data);
  return result;
}

function groupByToken(
  rows: PlayerTradeHubPosition[]
): GroupedPlayerTradeHubPosition {
  return rows.reduce<GroupedPlayerTradeHubPosition>(
    (acc, row) => {
      if (!acc.tokens[row.token]) {
        acc.tokens[row.token] = [];
      }
      acc.tokens[row.token].push(row);
      return acc;
    },
    { date: null, tokens: {} }
  );
}

function getDate(data: PlayerTradeHubPosition[]): string | null {
  if (data.length > 0 && data[0].date) {
    return new Date(data[0].date).toISOString();
  }
  return null; // fallback
}
