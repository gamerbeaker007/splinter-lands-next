"use client";

import { getRegionTax } from "@/lib/backend/actions/region/tax-actions";
import { FilterInput } from "@/types/filters";
import { RegionTax } from "@/types/regionTax";
import { useMemo } from "react";
import { useAsyncData } from "./useAsyncData";

// The serialised filters are the cache key, so the loader can stay stable and
// a re-created but equal filter object no longer triggers a refetch.
const loadRegionTax = (key: string) =>
  getRegionTax(JSON.parse(key) as FilterInput) as Promise<RegionTax[]>;

export function useRegionTaxInfo(filters?: FilterInput) {
  const filtersKey = useMemo(() => JSON.stringify(filters ?? {}), [filters]);

  const { data, loading, error } = useAsyncData(
    filtersKey,
    loadRegionTax,
    "Could not load region tax information."
  );

  return { regionTax: data, loading, error };
}
