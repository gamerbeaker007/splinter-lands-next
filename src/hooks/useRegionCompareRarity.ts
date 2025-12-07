"use client";

import logger from "@/lib/frontend/log/logger.client";
import { FilterInput } from "@/types/filters";
import { RarityResourceSummary } from "@/types/regionCompareProduction";
import { useCallback, useEffect, useMemo, useState } from "react";

export function useRegionCompareRarity(filters?: FilterInput) {
  const [regionCompareRarity, setRegionCompareRarity] =
    useState<RarityResourceSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtersKey = useMemo<FilterInput>(() => filters ?? {}, [filters]);

  async function fetchRegionCompareRarityImpl(
    filters: FilterInput
  ): Promise<RarityResourceSummary | null> {
    const url = "/api/region/compare/rarity";
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filters),
    });
    return await res.json();
  }

  const fetchRegionCompareRarity = useCallback(async (filters: FilterInput) => {
    setLoading(true);
    setError(null);

    try {
      const payload = await fetchRegionCompareRarityImpl(filters);
      setRegionCompareRarity(payload);
      return payload;
    } catch (err) {
      logger.error("Failed to fetch region compare rarity information:", err);
      setError("Could not load region compare rarity information.");
      setRegionCompareRarity(null);
      return null;
    } finally {
      setLoading(false);
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
