import { ResourceHubMetrics } from "@/generated/prisma/client";
import { getLastUpdate } from "@/lib/backend/cache/utils";
import { prisma } from "@/lib/prisma";
import logger from "../../log/logger.server";

let cachedTradeHubData: ResourceHubMetrics[] | null = null;
let cachedTimestamp: Date | null = null;

export async function getAllTradeHubData(): Promise<ResourceHubMetrics[]> {
  const lastUpdate = await getLastUpdate();
  if (!cachedTradeHubData || !cachedTimestamp || cachedTimestamp < lastUpdate) {
    logger.info("Refreshing trade hub data cache...");
    cachedTradeHubData = await prisma.resourceHubMetrics.findMany({
      orderBy: {
        date: "asc",
      },
    });
    cachedTimestamp = lastUpdate;
  }

  return cachedTradeHubData;
}

export async function getLatestTradeHubEntries(): Promise<
  ResourceHubMetrics[] | null
> {
  const all = await getAllTradeHubData();

  if (!all.length) return null;

  //Get the last date (from sorted ascending)
  const latestDate = all.at(-1)!.date;

  //Filter all entries with that date
  const latestEntries = all.filter(
    (entry) => entry.date.getTime() === latestDate.getTime()
  );

  return latestEntries;
}
