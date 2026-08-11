"use client";

import { getRegionTax } from "@/lib/backend/actions/region/tax-actions";
import logger from "@/lib/frontend/log/logger.client";
import { FilterInput } from "@/types/filters";
import { RegionTax } from "@/types/regionTax";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export function useRegionTaxInfo(filters?: FilterInput) {
  const [regionTax, setRegionTax] = useState<RegionTax[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtersKey = useMemo<FilterInput>(() => filters ?? {}, [filters]);

  // Monotonically increasing id so only the most recent request may write
  // state. Guards against stale responses landing out of order when the
  // filters change while a request is still in flight.
  const requestIdRef = useRef(0);

  const fetchRegionTax = useCallback(async (filters: FilterInput) => {
    const requestId = ++requestIdRef.current;
    const isStale = () => requestIdRef.current !== requestId;

    setLoading(true);
    setError(null);

    try {
      const payload = await getRegionTax(filters);
      if (isStale()) return payload as RegionTax[];
      setRegionTax(payload as RegionTax[]);
      return payload as RegionTax[];
    } catch (err) {
      if (isStale()) return null;
      logger.error("Failed to fetch region tax information:", err);
      setError("Could not load region tax information.");
      setRegionTax(null);
      return null;
    } finally {
      if (!isStale()) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRegionTax(filtersKey);
  }, [fetchRegionTax, filtersKey]);

  return {
    regionTax,
    loading,
    error,
  };
}
