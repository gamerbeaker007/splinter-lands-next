"use client";

import {
  getPlayerRegionData,
  getPlayerTaxData,
} from "@/lib/backend/actions/player/region-actions";
import { FilterInput } from "@/types/filters";
import { PlayerRegionDataType, RegionTaxSummary } from "@/types/resource";
import { useCallback, useEffect, useState } from "react";

/**
 * Hook for fetching player region overview data using server actions
 */
export function usePlayerRegionData(
  playerName: string | null,
  filters: FilterInput | null
) {
  const [data, setData] = useState<PlayerRegionDataType | null>(null);
  const [taxData, setTaxData] = useState<RegionTaxSummary[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState<string | null>(null);

  const fetchPlayerData = useCallback(
    async (force: boolean = false) => {
      if (!playerName || !filters) {
        setData(null);
        setTaxData(null);
        setError(null);
        setLoading(false);
        setLoadingText(null);
        return;
      }

      setLoading(true);
      setData(null);
      setTaxData(null);
      setError(null);
      setLoadingText("Fetching base player data...");

      try {
        // Fetch both in parallel
        const [regionData, taxDataResult] = await Promise.all([
          getPlayerRegionData(playerName, filters, force),
          getPlayerTaxData(playerName),
        ]);

        setData(regionData);
        setTaxData(taxDataResult);
        setLoadingText(null);
      } catch (err) {
        console.error("Failed to fetch player region data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load region data"
        );
        setData(null);
        setTaxData(null);
        setLoadingText("An error occurred while loading data.");
      } finally {
        setLoading(false);
      }
    },
    [playerName, filters]
  );

  useEffect(() => {
    fetchPlayerData(false);
  }, [fetchPlayerData]);

  return {
    data,
    taxData,
    loading,
    error,
    loadingText,
    refetch: fetchPlayerData,
  };
}
