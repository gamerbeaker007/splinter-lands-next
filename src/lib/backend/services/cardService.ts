import { dailyCache } from "@/lib/backend/cache/cache";
import { SplCardDetails } from "@/types/splCardDetails";
import { fetchCardDetails } from "../api/spl/spl-base-api";

export async function getCachedCardDetailsData(
  force = false,
): Promise<SplCardDetails[]> {
  const key = `card-details`;
  if (!force) {
    const cached = dailyCache.get<SplCardDetails[]>(key);
    if (cached) return cached;
  }

  const data = await fetchCardDetails();
  dailyCache.set(key, data);
  return data;
}
