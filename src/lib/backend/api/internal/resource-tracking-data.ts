import { ResourceTracking } from "@/generated/prisma";
import { getLastUpdate } from "@/lib/backend/cache/utils";
import { prisma } from "@/lib/prisma";
import logger from "../../log/logger.server";

let cachedResourceTrackingData: ResourceTracking[] | null = null;
let cachedTimestamp: Date | null = null;

export async function getAllResourceTrackingdata(): Promise<
  ResourceTracking[]
> {
  const lastUpdate = await getLastUpdate();
  if (
    !cachedResourceTrackingData ||
    !cachedTimestamp ||
    cachedTimestamp < lastUpdate
  ) {
    logger.info("Refreshing resourceTracking data cache...");
    cachedResourceTrackingData = await prisma.resourceTracking.findMany({
      orderBy: {
        date: "asc",
      },
    });
    cachedTimestamp = lastUpdate;
  }

  return cachedResourceTrackingData;
}

export async function getLatestResourceTrackingEntries(): Promise<
  ResourceTracking[] | null
> {
  const all = await getAllResourceTrackingdata();

  if (!all.length) return null;

  //Get the last date (from sorted ascending)
  const latestDate = all.at(-1)!.date;

  //Filter all entries with that date
  const latestEntries = all.filter(
    (entry) => entry.date.getTime() === latestDate.getTime()
  );

  return latestEntries;
}
