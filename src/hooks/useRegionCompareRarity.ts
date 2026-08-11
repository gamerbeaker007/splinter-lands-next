"use client";

import { getRegionCompareRarity } from "@/lib/backend/actions/region/compare-rarity-actions";
import logger from "@/lib/frontend/log/logger.client";
import { FilterInput } from "@/types/filters";
import { RarityResourceSummary } from "@/types/regionCompareProduction";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export function useRegionCompareRarity(filters?: FilterInput) {
  const [regionCompareRarity, setRegionCompareRarity] =
    useState<RarityResourceSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtersKey = useMemo<FilterInput>(() => filters ?? {}, [filters]);

  // Monotonically increasing id so only the most recent request may write
  // state. Guards against stale responses landing out of order when the
  // filters change while a request is still in flight.
  const requestIdRef = useRef(0);

  const fetchRegionCompareRarity = useCallback(async (filters: FilterInput) => {
    const requestId = ++requestIdRef.current;
    const isStale = () => requestIdRef.current !== requestId;

    setLoading(true);
    setError(null);

    try {
      const payload = await getRegionCompareRarity(filters);
      if (isStale()) return payload;
      setRegionCompareRarity(payload);
      return payload;
    } catch (err) {
      if (isStale()) return null;
      logger.error("Failed to fetch region compare rarity information:", err);
      setError("Could not load region compare rarity information.");
      setRegionCompareRarity(null);
      return null;
    } finally {
      if (!isStale()) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRegionCompareRarity(filtersKey);
  }, [fetchRegionCompareRarity, filtersKey]);

  return {
    regionCompareRarity,
    loading,
    error,
  };
}
