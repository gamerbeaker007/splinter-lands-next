"use server";
import { Prices } from "@/types/price";
import { cacheLife } from "next/cache";
import { getResourceDECPrices } from "../../helpers/resourcePrices";
import { getCachedSplPriceData } from "@/lib/backend/services/tokenService";
import { SplPriceData } from "@/types/price";

/**
 * Get resource prices with hourly cache.
 */
export async function getActualResourcePrices(): Promise<Prices> {
  "use cache";
  cacheLife("seconds");

  const data = await getResourceDECPrices();
  return data;
}

/**
 * Get token prices with hourly cache.
 */
export async function getTokenPrices(): Promise<SplPriceData> {
  const data = await getCachedSplPriceData(false);

  // Convert Prices to SplPriceData
  const splPriceData: SplPriceData = {
    hive: data.hive ?? 0,
    hbd: data.hbd ?? 0,
    sps: data.sps ?? 0,
    dec: data.dec ?? 0,
    voucher: data.voucher ?? 0,
  };

  return splPriceData;
}
