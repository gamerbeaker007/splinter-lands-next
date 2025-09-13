import { Deed } from "@/generated/prisma";
import { SplMarketCardData } from "@/types/splMarketCardData copy";
import { fetchMarketCardData } from "../api/spl/spl-base-api";
import { fetchMarketLandData } from "../api/spl/spl-land-api";
import { cache } from "../cache/cache";

export async function getCachedMarketCardData(
  force = false,
): Promise<SplMarketCardData[]> {
  const key = `market-cards`;
  if (!force) {
    const cached = cache.get<SplMarketCardData[]>(key);
    if (cached) return cached;
  }

  const data = await fetchMarketCardData();
  cache.set(key, data);
  return data;
}

export async function getCachedMarketLandData(force = false): Promise<Deed[]> {
  const key = `market-land`;
  if (!force) {
    const cached = cache.get<Deed[]>(key);
    if (cached) return cached;
  }

  console.log("Fetching land data from API");
  const data = await fetchMarketLandData();
  console.log("Fetched", data.length, "lands from market");
  cache.set(key, data);
  return data;
}
