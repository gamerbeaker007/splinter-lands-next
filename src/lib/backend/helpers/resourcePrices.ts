import { RESOURCE_PRESETS } from "@/constants/conversion/presets";
import {
  getAURAPrices,
  getLandResourcesPools,
} from "@/lib/backend/api/spl/spl-land-api";
import { getPrices } from "@/lib/backend/api/spl/spl-prices-api";
import { AuraPrices, Prices, SplPriceData } from "@/types/price";

function getPrice(
  landResourcePrices: Prices,
  prices: SplPriceData,
  auraPrices: AuraPrices[],
  token: string,
  amount: number,
): number {
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

  // VALUE BASED ON:  Midnight Potion (40 AURA)
  if (token === "AURA") {
    const mpUSD =
      auraPrices.find((item) => item.detailId === "MIDNIGHTPOT")?.minPrice ?? 0;
    const preset = RESOURCE_PRESETS.midnight;
    if (mpUSD > 0 && prices.dec > 0) {
      return mpUSD / prices.dec / preset.input.AURA;
    } else {
      return 0;
    }
  }

  // VALUE BASED ON: Fortune Tickets (200 AURA, 10 VOUCHER, 200 DEC)
  if (token === "AURA_FT") {
    const ftUSD =
      auraPrices.find((item) => item.detailId === "FT")?.minPrice ?? 0;

    if (ftUSD > 0 && prices.dec > 0) {
      const preset = RESOURCE_PRESETS.fortune;
      const voucherCostDEC =
        (preset.input.VOUCHER * prices.voucher) / prices.dec;
      const totalDec = ftUSD / prices.dec - preset.decExtra;
      return (totalDec - voucherCostDEC) / preset.input.AURA;
    }
  }

  // VALUE BASED ON: Auction Mark (1000 AURA, 50 VOUCHER, 500 DEC)
  if (token === "AURA_AM") {
    const amUSD =
      auraPrices.find((item) => item.detailId === "AM")?.minPrice ?? 0;
    if (amUSD > 0 && prices.dec > 0) {
      const preset = RESOURCE_PRESETS.auction;
      const voucherCostDEC =
        (preset.input.VOUCHER * prices.voucher) / prices.dec;
      const totalDec = amUSD / prices.dec - preset.decExtra; // subtract DEC explicitly listed
      return (totalDec - voucherCostDEC) / preset.input.AURA;
    }
  }

  // VALUE BASED ON: Wagon Kit (2500 AURA, other resources)
  if (token === "AURA_WAGONKIT") {
    const wagonUSD =
      auraPrices.find((item) => item.detailId === "WAGONKIT")?.minPrice ?? 0;
    const preset = RESOURCE_PRESETS.wagons;
    let baseCost = 0;
    Object.entries(preset.input).forEach(([res, amount]) => {
      if (amount > 0 && res != "AURA") {
        const matchingMetric = landResourcePrices[res] ?? null;
        baseCost += amount / matchingMetric;
      }
    });
    const totalDec = wagonUSD / prices.dec;
    return (totalDec - baseCost) / preset.input.AURA;
  }

  const matchingMetric = landResourcePrices[token] ?? null;
  if (!matchingMetric || !matchingMetric) {
    throw new Error(`Missing dec_price for token ${token}`);
  }

  return amount / matchingMetric;
}

export async function getResourceDECPrices() {
  const prices = await getPrices();
  const metrics = await getLandResourcesPools();
  const landPrices: Prices = Object.fromEntries(
    metrics.map((item: { token_symbol: string; dec_price: number }) => [
      item.token_symbol,
      item.dec_price,
    ]),
  );
  const consumablePrices = await getAURAPrices();

  const unitPrices: Prices = {};
  for (const key of [
    "GRAIN",
    "WOOD",
    "STONE",
    "IRON",
    "RESEARCH",
    "AURA",
    "AURA_AM",
    "AURA_FT",
    "AURA_WAGONKIT",
    "SPS",
    "VOUCHER",
  ]) {
    unitPrices[key] = getPrice(landPrices, prices, consumablePrices, key, 1);
  }

  return unitPrices;
}
