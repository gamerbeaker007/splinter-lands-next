"use client";

import { useAsyncData } from "@/hooks/useAsyncData";
import { invalidatePlayerBrowserCaches } from "@/lib/frontend/browser-cache";
import { loadPlayerOverview } from "@/lib/frontend/player-data";
import { useCallback } from "react";

export function usePlayerDashboard(player: string) {
  const { data, loading, error, refetch } = useAsyncData(
    player ? `dashboard|${player}` : null,
    () => loadPlayerOverview(player),
    { keepPreviousData: false, errorMessage: "Failed to fetch data" }
  );

  /** `force` drops the tab's memoized SPL reads for the player first. */
  const fetchPlayerData = useCallback(
    async (force: boolean = false) => {
      if (force && player) invalidatePlayerBrowserCaches(player);
      await refetch();
    },
    [player, refetch]
  );

  const loadingText = loading
    ? "Fetching base player data..."
    : error
      ? "An error occurred while loading data."
      : null;

  return {
    // The previous overview is hidden while a refresh runs, as before.
    playerOverview: loading ? null : (data ?? null),
    loadingText,
    fetchPlayerData,
    isPending: loading,
  };
}
