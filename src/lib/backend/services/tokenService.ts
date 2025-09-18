import { cache } from "@/lib/backend/cache/cache";
import { Prices, SplPriceData } from "@/types/price";
import { getPrices } from "../api/spl/spl-prices-api";

export async function getCachedSplPriceData(force = false): Promise<Prices> {
  const key = `spl-price-data`;
  if (!force) {
    const cached = cache.get<SplPriceData>(key);
    if (cached) return cached;
  }

  const data = await getPrices();
  cache.set(key, data);
  return data;
}
