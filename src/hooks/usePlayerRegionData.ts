"use client";

import { getPlayerTaxData } from "@/lib/backend/actions/player/region-actions";
import { invalidatePlayerBrowserCaches } from "@/lib/frontend/browser-cache";
import { loadPlayerRegionData } from "@/lib/frontend/player-data";
import { FilterInput } from "@/types/filters";
import { useCallback, useMemo } from "react";
import { useAsyncData } from "./useAsyncData";

/**
 * Hook for player region overview data: the region summary is computed in the
 * browser from the player's own deeds; the tax income comes from the server's
 * region-wide data.
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

  const {
    data,
    loading,
    error,
    refetch: reload,
  } = useAsyncData(
    key,
    async () => {
      const [regionData, taxData] = await Promise.all([
        loadPlayerRegionData(
          playerName as string,
          filters as FilterInput,
          includeTaxes,
          includeTransferFee
        ),
        getPlayerTaxData(playerName as string),
      ]);
      return { regionData, taxData };
    },
    { errorMessage: "Failed to load region data" }
  );

  const refetch = useCallback(
    (force: boolean = false) => {
      // A forced refresh drops the tab's memoized SPL reads for the player.
      if (force && playerName) invalidatePlayerBrowserCaches(playerName);
      void reload();
    },
    [reload, playerName]
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
