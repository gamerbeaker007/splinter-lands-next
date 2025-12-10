"use server";

import { getCachedSplPriceData } from "@/lib/backend/services/tokenService";
import { SplPriceData } from "@/types/price";

/**
 * Get token prices with hourly cache.
 */
export async function getPlanningTokenPrices(): Promise<SplPriceData> {
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
