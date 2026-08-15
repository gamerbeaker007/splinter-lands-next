"use client";

import {
  getPlayerRegionData,
  getPlayerTaxData,
} from "@/lib/backend/actions/player/region-actions";
import { FilterInput } from "@/types/filters";
import { PlayerRegionDataType, RegionTaxSummary } from "@/types/resource";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Hook for fetching player region overview data using server actions
 */
export function usePlayerRegionData(
  playerName: string | null,
  filters: FilterInput | null,
  includeTaxes: boolean = true,
  includeTransferFee: boolean = true
) {
  const [data, setData] = useState<PlayerRegionDataType | null>(null);
  const [taxData, setTaxData] = useState<RegionTaxSummary[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState<string | null>(null);

  // Monotonically increasing id so only the most recent request may write
  // state. Guards against stale responses landing out of order when the
  // player/filters change while a request is still in flight.
  const requestIdRef = useRef(0);

  const fetchPlayerData = useCallback(
    async (force: boolean = false) => {
      const requestId = ++requestIdRef.current;
      const isStale = () => requestIdRef.current !== requestId;

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
          getPlayerRegionData(
            playerName,
            filters,
            includeTaxes,
            includeTransferFee,
            force
          ),
          getPlayerTaxData(playerName),
        ]);
        if (isStale()) return;

        setData(regionData);
        setTaxData(taxDataResult);
        setLoadingText(null);
      } catch (err) {
        if (isStale()) return;
        console.error("Failed to fetch player region data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load region data"
        );
        setData(null);
        setTaxData(null);
        setLoadingText("An error occurred while loading data.");
      } finally {
        if (!isStale()) setLoading(false);
      }
    },
    [playerName, filters, includeTaxes, includeTransferFee]
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
