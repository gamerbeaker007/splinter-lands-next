import { ResourceHubMetrics, PlayerTradeHubPosition } from "@/generated/prisma";
import {
  getLandResourcesPools,
  fetchPlayerPoolInfo,
} from "@/lib/backend/api/spl/spl-land-api";
import logger from "@/lib/backend/log/logger.server";
import { prisma } from "@/lib/prisma";
import pLimit from "p-limit";

const limit = pLimit(5);
const MIN_INTERVAL_MS = 15;
let nextAvailableTime = Date.now();

export async function computeAndStorePlayerHubPosition(today: Date) {
  const players = await prisma.deed.findMany({
    distinct: ["player"],
    select: { player: true },
  });

  const playerNames: string[] = players
    .filter((p) => p.player !== null)
    .map((p) => p.player as string);
  // .slice(0, 10); // enable for debug purposes

  const metrics = await getLandResourcesPools();

  const playersTradeHubPosition = await throttledFetchAllAssets(
    today,
    playerNames,
    metrics,
  );

  logger.info(`🧹 playerTradeHubPosition - Clearing existing data...`);
  await prisma.playerTradeHubPosition.deleteMany();

  logger.info(
    `📦 Injecting ${playersTradeHubPosition.length} playerTradeHubPosition...`,
  );

  await prisma.playerTradeHubPosition.createMany({
    data: playersTradeHubPosition,
  });
}

async function throttleRate(minIntervalMs: number) {
  const now = Date.now();
  const waitTime = Math.max(0, nextAvailableTime - now);
  nextAvailableTime = Math.max(now, nextAvailableTime) + minIntervalMs;
  if (waitTime > 0) {
    await new Promise((res) => setTimeout(res, waitTime));
  }
}

export async function throttledFetchAllAssets(
  today: Date,
  players: string[],
  metrics: ResourceHubMetrics[],
): Promise<PlayerTradeHubPosition[]> {
  const results: PlayerTradeHubPosition[] = [];
  let current = 0;

  const tasks = players.map((player) =>
    limit(async () => {
      await throttleRate(MIN_INTERVAL_MS);

      try {
        const result = await fetchPlayerPoolInfo(player);

        result.map((row) => enrichData(row, today, metrics));
        results.push(...result);

        if (++current % 10 === 0) {
          logger.info(
            `playerTradeHubPosition - Fetched ${current} out of ${players.length}`,
          );
        }

        return result;
      } catch (err) {
        console.error(`Failed to fetch pool info for ${player}:`, err);
        return null;
      }
    }),
  );

  await Promise.all(tasks);
  return results;
}

export function enrichData(
  playerTradeHubPosition: PlayerTradeHubPosition,
  today: Date,
  metrics: ResourceHubMetrics[],
) {
  playerTradeHubPosition.date = today;
  const resource = playerTradeHubPosition.token.split("-")[1];
  const totalShares = Number(
    metrics.find((metric) => metric.token_symbol === resource)?.total_shares ??
      0,
  );
  playerTradeHubPosition.share_percentage =
    totalShares > 0 ? (playerTradeHubPosition.balance / totalShares) * 100 : 0;
}
