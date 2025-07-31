// hooks/useResourceConversion.ts
import { Mode } from "@/types/mode";
import {
  CALCULATOR_RESOURCES,
  CalculatorResource,
} from "@/constants/resource/resource";
import { Prices } from "@/types/price";
import { useMemo } from "react";
import { calcDECPrice } from "@/lib/shared/costCalc";

export function useResourceConversion(
  mode: Mode,
  resourcesInput: Record<CalculatorResource, number>,
  decExtra: number,
  prices: Prices | null,
) {
  const dec_total = useMemo(() => {
    if (!prices) return 0;
    return CALCULATOR_RESOURCES.reduce((sum, res) => {
      const amount = resourcesInput[res] || 0;
      return sum + calcDECPrice(mode, res, amount, prices);
    }, 0);
  }, [resourcesInput, mode, prices]);

  const sps_amount = useMemo(() => {
    if (!prices) return 0;
    return (dec_total + decExtra) / prices.sps;
  }, [dec_total, decExtra, prices]);

  return { dec_total, sps_amount };
}
