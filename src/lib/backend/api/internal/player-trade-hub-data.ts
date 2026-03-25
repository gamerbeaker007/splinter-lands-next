"use server";
import { PlayerTradeHubPosition } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import logger from "../../log/logger.server";

export async function getPlayerTradeHubPositionData(): Promise<
  PlayerTradeHubPosition[]
> {
  const latestRow = await prisma.playerTradeHubPosition.findFirst({
    orderBy: { date: "desc" },
    select: { date: true },
  });

  if (!latestRow) {
    logger.warn("No PlayerTradeHubPosition data found.");
    return [];
  }

  return prisma.playerTradeHubPosition.findMany({
    where: { date: latestRow.date },
  });
}
