"use client";

import { getFilteredEnrichedTractDeeds } from "@/lib/backend/actions/region/tract-deed-actions";
import { useFilters } from "@/lib/frontend/context/FilterContext";
import { useMemo } from "react";
import { useProgressiveDeeds } from "./useProgressiveDeeds";

/**
 * Two-phase hook for SSR-friendly tract deed loading with progress
 * indication. See {@link useProgressiveDeeds} for the phases.
 */
export const useTractDeedData = (
  selectedRegion: number | "",
  selectedTract: number | ""
) => {
  const { filters } = useFilters();

  const scopedFilters = useMemo(
    () =>
      filters && selectedRegion && selectedTract
        ? {
            ...filters,
            filter_regions: [selectedRegion],
            filter_tracts: [selectedTract],
          }
        : null,
    [filters, selectedRegion, selectedTract]
  );

  return useProgressiveDeeds(
    scopedFilters && JSON.stringify(scopedFilters),
    () => getFilteredEnrichedTractDeeds(scopedFilters!),
    "Gathering tract deed data...",
    "An error occurred"
  );
};
