"use client";

import { useAsyncData } from "@/hooks/useAsyncData";
import { loadPlayerCardAlerts } from "@/lib/frontend/player-data";

/**
 * `force` is toggled by the dashboard's refresh, which also drops the tab's
 * memoized SPL reads — so flipping it re-reads live data.
 */
export function usePlayerAlerts(player: string, force: boolean = false) {
  const { data, loading, error } = useAsyncData(
    player ? `alerts|${player}|${force}` : null,
    () => loadPlayerCardAlerts(player),
    { keepPreviousData: false, errorMessage: "Unknown error" }
  );

  return { cardAlerts: data ?? null, loading, error };
}
