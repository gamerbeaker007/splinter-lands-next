import { getLastUpdate } from "@/lib/backend/cache/utils";
import { prisma } from "@/lib/prisma";
import logger from "../../log/logger.server";
import { PlayerTradeHubPosition } from "@/generated/prisma";

let cachedPlayerTradeHubPositionData: PlayerTradeHubPosition[] | null = null;
let cachedTimestamp: Date | null = null;

export async function getPlayerTradeHubPositionData(): Promise<
  PlayerTradeHubPosition[]
> {
  const lastUpdate = await getLastUpdate();
  if (
    !cachedPlayerTradeHubPositionData ||
    !cachedTimestamp ||
    cachedTimestamp < lastUpdate
  ) {
    logger.info("Refreshing resourceTracking data cache...");
    cachedPlayerTradeHubPositionData =
      await prisma.playerTradeHubPosition.findMany({});
    cachedTimestamp = lastUpdate;
  }

  return cachedPlayerTradeHubPositionData;
}
