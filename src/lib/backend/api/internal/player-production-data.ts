import { getLastUpdate } from "@/lib/backend/cache/utils";
import { prisma } from "@/lib/prisma";
import logger from "../../log/logger.server";
import { PlayerProductionSummary } from "@/generated/prisma/client";

let cachedPlayerProductionSummaryData: PlayerProductionSummary[] | null = null;
let cachedTimestamp: Date | null = null;

export async function getPlayerProductionData(): Promise<
  PlayerProductionSummary[]
> {
  const lastUpdate = await getLastUpdate();
  if (
    !cachedPlayerProductionSummaryData ||
    !cachedTimestamp ||
    cachedTimestamp < lastUpdate
  ) {
    logger.info("Refreshing resourceTracking data cache...");
    cachedPlayerProductionSummaryData =
      await prisma.playerProductionSummary.findMany({});
    cachedTimestamp = lastUpdate;
  }

  return cachedPlayerProductionSummaryData;
}
