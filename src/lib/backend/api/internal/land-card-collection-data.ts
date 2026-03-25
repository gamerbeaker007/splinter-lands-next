"use server";

import { prisma } from "@/lib/prisma";
import logger from "../../log/logger.server";
import { PlayerCardEditionSummary } from "@/generated/prisma/client";

export async function getLandCardCollectionRawData(
  playerFilter?: string[]
): Promise<{ rows: PlayerCardEditionSummary[]; date: Date | null }> {
  const latestRecord = await prisma.playerCardEditionSummary.findFirst({
    orderBy: { date: "desc" },
    select: { date: true },
  });

  if (!latestRecord) {
    logger.warn("No land card collection data found.");
    return { rows: [], date: null };
  }

  const latestDate = latestRecord.date;
  const playerWhere = playerFilter?.length
    ? { player: { in: playerFilter } }
    : {};

  const rows = await prisma.playerCardEditionSummary.findMany({
    where: { date: latestDate, ...playerWhere },
    orderBy: { card_set: "asc" },
  });

  return { rows, date: latestDate };
}
