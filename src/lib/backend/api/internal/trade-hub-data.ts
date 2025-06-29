import { ResourceHubMetrics } from "@/generated/prisma";
import { getLastUpdate } from "@/lib/backend/cache/utils";
import { prisma } from "@/lib/prisma";
import logger from "../../log/logger.server";

let cachedTradeHubData: ResourceHubMetrics[] | null = null;
let cachedTimestamp: Date | null = null;

export async function getAllTradeHubData(): Promise<ResourceHubMetrics[]> {
  const lastUpdate = await getLastUpdate();
  if (!cachedTradeHubData || !cachedTimestamp || cachedTimestamp < lastUpdate) {
    logger.info("Refreshing active data cache...");
    cachedTradeHubData = await prisma.resourceHubMetrics.findMany({
      orderBy: {
        date: "asc",
      },
    });
    cachedTimestamp = lastUpdate;
  }

  return cachedTradeHubData;
}
