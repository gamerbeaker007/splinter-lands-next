import { getPrices } from "@/lib/backend/api/spl/spl-prices-api";
import {
  getLandResourcesPools,
  getMidnightPotionPrice,
} from "@/lib/backend/api/spl/spl-land-api";
import { SplPriceData } from "@/types/price";

async function getPrice(
  metrics: [{ token_symbol: string; dec_price: number }],
  prices: SplPriceData,
  token: string,
  amount: number,
): Promise<number> {
  if (token === "RESEARCH") {
    return 0;
  }

  if (token === "SPS") {
    const usdValue = amount * prices.sps;
    return usdValue / prices.dec;
  }

  if (token === "VOUCHER") {
    const usdValue = amount * prices.voucher;
    return usdValue / prices.dec;
  }

  if (token === "AURA") {
    const usdPrice = await getMidnightPotionPrice(); // this should return a number
    if (usdPrice) {
      const potionUSD = (amount / 40) * usdPrice;
      return potionUSD / prices.dec;
    } else {
      return 0;
    }
  }

  const matchingMetric = metrics.find((m) => m.token_symbol === token);
  if (!matchingMetric || !matchingMetric.dec_price) {
    throw new Error(`Missing dec_price for token ${token}`);
  }

  return amount / matchingMetric.dec_price;
}

export async function getResourceDECPrices() {
  const prices = await getPrices();
  const metrics = await getLandResourcesPools();

  const unitPrices: Record<string, number> = {};
  for (const key of [
    "GRAIN",
    "WOOD",
    "STONE",
    "IRON",
    "RESEARCH",
    "AURA",
    "SPS",
    "VOUCHER",
  ]) {
    unitPrices[key.toLowerCase()] = await getPrice(metrics, prices, key, 1);
  }

  return unitPrices;
}
