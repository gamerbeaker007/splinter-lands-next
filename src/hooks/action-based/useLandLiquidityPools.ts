"use client";
import { getLandLiquidityPools } from "@/lib/backend/actions/tradeHub";
import { SplLandPool } from "@/types/spl/landPools";
import { useCallback, useEffect, useState } from "react";

interface useLiquidityPoolsReturn {
  landPoolData: SplLandPool[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface Props {
  autoFetch?: boolean;
}

export function useLandLiquidityPools(
  options: Props = {}
): useLiquidityPoolsReturn {
  const { autoFetch = true } = options;
  const [landPoolData, setLandPoolData] = useState<SplLandPool[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const landPoolResult = await getLandLiquidityPools();
      setLandPoolData(landPoolResult);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch data";
      setError(errorMessage);
      console.error("Card data fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [fetchData, autoFetch]);

  return {
    landPoolData,
    loading,
    error,
    refetch: fetchData,
  };
}
