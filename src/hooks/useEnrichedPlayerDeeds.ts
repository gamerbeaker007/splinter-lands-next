import {
  enrichDeedsWithStakedAssets,
  getFilteredEnrichedPlayerDeeds,
} from "@/lib/backend/actions/player/enriched-deed-actions";
import { DeedComplete } from "@/types/deed";
import { FilterInput } from "@/types/filters";
import { useCallback, useEffect, useState } from "react";

/**
 * Two-phase hook for SSR-friendly deed loading with progress indication:
 * Phase 1: Fast server action to get filtered deeds (without staked assets)
 * Phase 2: Progressive enrichment with staked assets (with progress updates)
 */
export function useEnrichedPlayerDeeds(
  playerName: string | null,
  filters: FilterInput | null
) {
  const [deeds, setDeeds] = useState<DeedComplete[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [warning, setWarning] = useState<string | null>(null);

  const fetchDeeds = useCallback(async () => {
    if (!playerName || !filters) {
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
      // Phase 1: Fast call to get filtered deeds (without staked assets)
      setLoadingText("Gathering player data...");
      const result = await getFilteredEnrichedPlayerDeeds(playerName, filters);

      setWarning(result.warning);
      setTotal(result.total);
      setDeeds(result.deeds);

      // Phase 2: Progressive enrichment with staked assets in fewer, larger batches
      setLoadingText(`Fetching staked assets... 0 / ${result.total}`);

      let enrichedCount = 0;
      const enrichedDeeds: DeedComplete[] = [];

      // Use larger batches (10 deeds per server action call) to reduce roundtrips
      // Each server action internally processes 10 deeds in parallel
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
      console.error("Failed to fetch enriched player deeds:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load enriched deeds"
      );
      setDeeds([]);
      setLoadingText("An error occurred while loading deeds.");
    } finally {
      setLoading(false);
    }
  }, [playerName, filters]);

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
}
