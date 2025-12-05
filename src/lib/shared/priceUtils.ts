import { EMA, SMA } from "technicalindicators";
import { TRADE_HUB_FEE } from "./statics";

export function paddedSMA(values: number[], period: number = 20) {
  const sma = SMA.calculate({ period, values });
  const padding = Array(period - 1).fill(null);
  return [...padding, ...sma];
}

export function paddedEMA(values: number[], period: number = 20) {
  const ema = EMA.calculate({ period, values });
  const padding = Array(period - 1).fill(null);
  return [...padding, ...ema];
}

export interface PriceImpactResult {
  amountReceived: number;
  priceImpact: number;
}

/**
 * Calculate price impact for a constant product AMM swap (x * y = k)
 * @param X - Amount of token being swapped in
 * @param totalX - Total amount of X token in pool
 * @param totalY - Total amount of Y token in pool
 * @returns Price impact result with output amount after fee
 */
export const calculatePriceImpact = (
  X: number,
  totalX: number,
  totalY: number,
): PriceImpactResult => {
  const constantProduct = totalX * totalY; // totalShares = k

  // After swap: X pool increases, Y pool decreases
  const newTotalX = totalX + X;
  const newTotalY = constantProduct / newTotalX;
  const outputBeforeFee = totalY - newTotalY;
  const amountReceivedAfterTax = outputBeforeFee * TRADE_HUB_FEE;

  if (amountReceivedAfterTax <= 0) {
    return { amountReceived: 0, priceImpact: 0 };
  }

  const priceImpact = (1 - totalX / newTotalX) * 100;

  return {
    amountReceived: amountReceivedAfterTax,
    priceImpact,
  };
};
