import { ResourceSupply } from "@/generated/prisma";
import { getLastUpdate } from "@/lib/backend/cache/utils";
import { prisma } from "@/lib/prisma";
import logger from "../../log/logger.server";

let cachedResourceSupplyData: ResourceSupply[] | null = null;
let cachedTimestamp: Date | null = null;

export async function getAllResourceSupplyData(): Promise<ResourceSupply[]> {
  const lastUpdate = await getLastUpdate();
  if (
    !cachedResourceSupplyData ||
    !cachedTimestamp ||
    cachedTimestamp < lastUpdate
  ) {
    logger.info("Refreshing ResourceSupply data cache...");
    cachedResourceSupplyData = await prisma.resourceSupply.findMany({
      orderBy: {
        date: "asc",
      },
    });
    cachedTimestamp = lastUpdate;
  }

  return cachedResourceSupplyData;
}

export async function getLatestResourceSupplyEntries(): Promise<
  ResourceSupply[] | null
> {
  const all = await getAllResourceSupplyData();

  if (!all.length) return null;

  //Get the last date (from sorted ascending)
  const latestDate = all.at(-1)!.date;

  //Filter all entries with that date
  const latestEntries = all.filter(
    (entry) => entry.date.getTime() === latestDate.getTime()
  );

  return latestEntries;
}
