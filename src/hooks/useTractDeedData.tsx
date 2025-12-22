"use client";

import { enrichDeedsWithStakedAssets } from "@/lib/backend/actions/player/enriched-deed-actions";
import { getFilteredEnrichedTractDeeds } from "@/lib/backend/actions/region/tract-deed-actions";
import { useFilters } from "@/lib/frontend/context/FilterContext";
import { DeedComplete } from "@/types/deed";
import { useCallback, useEffect, useState } from "react";

/**
 * Two-phase hook for SSR-friendly tract deed loading with progress indication:
 * Phase 1: Fast server action to get filtered tract deeds (without staked assets)
 * Phase 2: Progressive enrichment with staked assets (with progress updates)
 */
export const useTractDeedData = (
  selectedRegion: number | "",
  selectedTract: number | ""
) => {
  const [deeds, setDeeds] = useState<DeedComplete[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const { filters } = useFilters();

  const fetchDeeds = useCallback(async () => {
    if (!filters || !selectedRegion || !selectedTract) {
      setDeeds([]);
      setError(null);
      setLoading(false);
      setLoadingText(null);
      setProgress(0);
      setTotal(0);
      setWarning(null);
      return;
    }

    setLoading(true);

    setDeeds([]);
    setError(null);
    setProgress(0);
    setTotal(0);
    setWarning(null);

    try {
      // Phase 1: Fast call to get filtered tract deeds (without staked assets)
      setLoadingText("Gathering tract deed data...");

      const updatedFilters = {
        ...filters,
        filter_regions: [selectedRegion],
        filter_tracts: [selectedTract],
      };

      const result = await getFilteredEnrichedTractDeeds(updatedFilters);

      setWarning(result.warning);
      setTotal(result.total);
      setDeeds(result.deeds);

      // Phase 2: Progressive enrichment with staked assets
      setLoadingText(`Fetching staked assets... 0 / ${result.total}`);

      let enrichedCount = 0;
      const enrichedDeeds: DeedComplete[] = [];

      // Use larger batches (50 deeds per server action call) to reduce roundtrips
      // Each server action internally processes with concurrency limit of 5
      const BATCH_SIZE = 10;
      for (let i = 0; i < result.deeds.length; i += BATCH_SIZE) {
        const batch = result.deeds.slice(i, i + BATCH_SIZE);

        // Single server action call that processes the entire batch in parallel
        const enrichedBatch = await enrichDeedsWithStakedAssets(batch);

        enrichedDeeds.push(...enrichedBatch);
        enrichedCount += enrichedBatch.length;

        // Update only progress indicators, NOT the deeds array
        // This prevents re-rendering the entire deed list on each batch
        setProgress(enrichedCount);
        setLoadingText(
          `Fetching staked assets... ${enrichedCount} / ${result.total}`
        );
      }

      // Update deeds only once when all enrichment is complete
      setDeeds(enrichedDeeds);
      setLoadingText(null);
    } catch (err) {
      console.error("Failed to load tract deed data:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoadingText(null);
      setDeeds([]);
    } finally {
      setLoading(false);
    }
  }, [filters, selectedRegion, selectedTract]);

  useEffect(() => {
    fetchDeeds();
  }, [fetchDeeds]);

  return {
    deeds,
    loading,
    error,
    loadingText,
    progress: (progress / total) * 100,
    total,
    warning,
    refetch: fetchDeeds,
  };
};
