import { cache } from "@/lib/backend/cache/cache";
import { getResourceDECPrices } from "@/lib/backend/helpers/resourcePrices";
import { Prices } from "@/types/price";

export async function getCachedResourcePrices(force = false): Promise<Prices> {
  const key = `resource-price-data`;
  if (!force) {
    const cached = cache.get<Record<string, number>>(key);
    if (cached) return cached;
  }

  const data = await getResourceDECPrices();
  cache.set(key, data);
  return data;
}
