"use client";

import { getLandLiquidityPools } from "@/lib/backend/actions/resources/trade-hub-actions";
import { SplLandPool } from "@/types/spl/landPools";
import { useAsyncData } from "./useAsyncData";

interface UseLiquidityPoolsReturn {
  landPoolData: SplLandPool[];
  timeStamp: string | null;
  loading: boolean;
  error: string | null;
  /** Drops the current result and fetches again. */
  refetch: () => void;
}

const POOLS_KEY = "land-liquidity-pools";

export function useLandLiquidityPools(): UseLiquidityPoolsReturn {
  const { data, loading, error, reload } = useAsyncData(
    POOLS_KEY,
    getLandLiquidityPools,
    "Failed to fetch data"
  );

  return {
    landPoolData: data?.data ?? [],
    timeStamp: data?.timeStamp ?? null,
    loading,
    error,
    refetch: reload,
  };
}
