"use client";

import logger from "@/lib/frontend/log/logger.client";
import {FilterInput} from "@/types/filters";
import {useCallback, useEffect, useMemo, useState} from "react";
import {RegionTax} from "@/types/regionTax";

export function useRegionTaxInfo(
  filters?: FilterInput,
) {
  const [regionTax, setRegionTax] = useState<RegionTax[] | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtersKey = useMemo<FilterInput>(
      () => filters ?? {},
      [filters]
  );

  async function fetchRegionTaxImpl(filters: FilterInput): Promise<RegionTax[]> {
    const url = "/api/region/tax"
    const res  = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filters),
    })
    return await res.json()
  }

  const fetchRegionTax = useCallback(
    async (filters: FilterInput) => {
      setLoading(true);
      setError(null);

      try {
        const payload = await fetchRegionTaxImpl(filters);
        setRegionTax(payload as RegionTax[]);
        return payload as RegionTax[];
      } catch (err) {
        logger.error("Failed to fetch region tax information:", err);
        setError("Could not load region tax information.");
        setRegionTax(null);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchRegionTax(filtersKey);
  }, [fetchRegionTax, filtersKey]);

  return {
    regionTax,
    loading,
    error,
  };
}
