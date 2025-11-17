import { EMA, SMA } from "technicalindicators";

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
