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
 * @param feeMultiplier - Fee retention multiplier to apply to the output
 *   (e.g. 0.9 = 10% fee, 0.95 = 5% fee, 1 = no fee). Defaults to
 *   TRADE_HUB_FEE (single-hop 10% fee).
 * @returns Price impact result with output amount after fee
 */
/**
 * Inverse of calculatePriceImpact: given a desired output amount, return the
 * required input. Solves x*y=k in reverse.
 * Returns Infinity when the pool cannot supply the desired output.
 *
 * @param desiredOut    - Amount of output token wanted
 * @param totalX        - Pool reserve of the INPUT token
 * @param totalY        - Pool reserve of the OUTPUT token
 * @param feeMultiplier - Fee retention multiplier applied on this hop.
 */
export const calculatePriceImpactInverse = (
  desiredOut: number,
  totalX: number,
  totalY: number,
  feeMultiplier: number = TRADE_HUB_FEE
): number => {
  // Forward:  out = (X * totalY / (X + totalX)) * fee
  // Inverse:  X   = (desiredOut/fee * totalX) / (totalY - desiredOut/fee)
  const effectiveOut = desiredOut / feeMultiplier;
  if (effectiveOut >= totalY) return Infinity;
  return (effectiveOut * totalX) / (totalY - effectiveOut);
};

export const calculatePriceImpact = (
  X: number,
  totalX: number,
  totalY: number,
  feeMultiplier: number = TRADE_HUB_FEE
): PriceImpactResult => {
  const constantProduct = totalX * totalY; // totalShares = k

  // After swap: X pool increases, Y pool decreases
  const newTotalX = totalX + X;
  const newTotalY = constantProduct / newTotalX;
  const outputBeforeFee = totalY - newTotalY;
  const amountReceived = outputBeforeFee * feeMultiplier;

  if (amountReceived <= 0) {
    return { amountReceived: 0, priceImpact: 0 };
  }

  const priceImpact = (1 - totalX / newTotalX) * 100;

  return {
    amountReceived,
    priceImpact,
  };
};
