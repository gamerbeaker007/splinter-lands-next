"use client";

import { useAsyncData } from "@/hooks/useAsyncData";
import { loadPlayerAlerts } from "@/lib/frontend/player-data";

/**
 * `force` is toggled by the dashboard's refresh, which also drops the tab's
 * memoized SPL reads — so flipping it re-reads live data.
 */
export function usePlayerAlerts(player: string, force: boolean = false) {
  const { data, loading, error } = useAsyncData(
    player ? `alerts|${player}|${force}` : null,
    () => loadPlayerAlerts(player),
    { keepPreviousData: false, errorMessage: "Unknown error" }
  );

  return { playerAlerts: data ?? null, loading, error };
}
