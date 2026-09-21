"use client";

import { getRegionCompareRarity } from "@/lib/backend/actions/region/compare-rarity-actions";
import { FilterInput } from "@/types/filters";
import { useMemo } from "react";
import { useAsyncData } from "./useAsyncData";

// The serialised filters are the cache key, so the loader can stay stable and
// a re-created but equal filter object no longer triggers a refetch.
const loadCompareRarity = (key: string) =>
  getRegionCompareRarity(JSON.parse(key) as FilterInput);

export function useRegionCompareRarity(filters?: FilterInput) {
  const filtersKey = useMemo(() => JSON.stringify(filters ?? {}), [filters]);

  const { data, loading, error } = useAsyncData(
    filtersKey,
    loadCompareRarity,
    "Could not load region compare rarity information."
  );

  return { regionCompareRarity: data, loading, error };
}
