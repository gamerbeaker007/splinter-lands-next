import { Prices } from "@/types/price";
import { cacheLife } from "next/cache";
import { getResourceDECPrices } from "../../helpers/resourcePrices";

/**
 * Get resource prices with hourly cache.
 */
export async function getActualResourcePrices(): Promise<Prices> {
  "use cache";
  cacheLife("seconds");

  const data = await getResourceDECPrices();
  return data;
}
