"use client";

import { loadFilteredEnrichedPlayerDeeds } from "@/lib/frontend/player-data";
import { FilterInput } from "@/types/filters";
import { useMemo } from "react";
import { useProgressiveDeeds } from "./useProgressiveDeeds";

/**
 * Two-phase hook for SSR-friendly deed loading with progress indication.
 * See {@link useProgressiveDeeds} for the phases.
 */
export function useEnrichedPlayerDeeds(
  playerName: string | null,
  filters: FilterInput | null
) {
  const key = useMemo(
    () =>
      playerName && filters ? JSON.stringify({ playerName, filters }) : null,
    [playerName, filters]
  );

  return useProgressiveDeeds(
    key,
    () =>
      loadFilteredEnrichedPlayerDeeds(
        playerName as string,
        filters as FilterInput
      ),
    "Gathering player data..."
  );
}
