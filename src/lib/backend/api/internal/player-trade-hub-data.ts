import { prisma } from "@/lib/prisma";
import logger from "../../log/logger.server";
import { PlayerTradeHubPosition } from "@/generated/prisma/client";

let cachedPlayerTradeHubPositionData: PlayerTradeHubPosition[] | null = null;
let cachedTimestamp: Date | null = null;

export async function getPlayerTradeHubPositionData(): Promise<
  PlayerTradeHubPosition[]
> {
  const latestRow = await prisma.playerTradeHubPosition.findFirst({
    orderBy: { date: "desc" },
    select: { date: true },
  });

  const latestDate = latestRow?.date ?? null;

  if (!latestRow) {
    logger.warn("No PlayerTradeHubPosition data found.");
  }

  if (
    !cachedPlayerTradeHubPositionData ||
    !cachedTimestamp ||
    (latestDate && cachedTimestamp < latestDate)
  ) {
    logger.info("Refreshing PlayerTradeHubPosition cache...");
    cachedPlayerTradeHubPositionData =
      await prisma.playerTradeHubPosition.findMany({});
    cachedTimestamp = latestDate;
  }

  return cachedPlayerTradeHubPositionData;
}
