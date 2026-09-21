"use client";

import {
  getPlayerRegionData,
  getPlayerTaxData,
} from "@/lib/backend/actions/player/region-actions";
import { FilterInput } from "@/types/filters";
import { useCallback, useMemo, useRef } from "react";
import { useAsyncData } from "./useAsyncData";

/**
 * Hook for fetching player region overview data using server actions.
 */
export function usePlayerRegionData(
  playerName: string | null,
  filters: FilterInput | null,
  includeTaxes: boolean = true,
  includeTransferFee: boolean = true
) {
  const key = useMemo(
    () =>
      playerName && filters
        ? JSON.stringify({
            playerName,
            filters,
            includeTaxes,
            includeTransferFee,
          })
        : null,
    [playerName, filters, includeTaxes, includeTransferFee]
  );

  // `force` is not part of the cache key — it is a property of the *next*
  // request, not of the data being asked for.
  const forceNext = useRef(false);

  const { data, loading, error, reload } = useAsyncData(
    key,
    async () => {
      const force = forceNext.current;
      forceNext.current = false;
      const [regionData, taxData] = await Promise.all([
        getPlayerRegionData(
          playerName as string,
          filters as FilterInput,
          includeTaxes,
          includeTransferFee,
          force
        ),
        getPlayerTaxData(playerName as string),
      ]);
      return { regionData, taxData };
    },
    "Failed to load region data"
  );

  const refetch = useCallback(
    (force: boolean = false) => {
      forceNext.current = force;
      reload();
    },
    [reload]
  );

  return {
    data: data?.regionData ?? null,
    taxData: data?.taxData ?? null,
    loading,
    error,
    loadingText: loading
      ? "Fetching base player data..."
      : error
        ? "An error occurred while loading data."
        : null,
    refetch,
  };
}
