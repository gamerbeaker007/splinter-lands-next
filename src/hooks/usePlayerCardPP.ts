"use client";

import { useAsyncData } from "@/hooks/useAsyncData";
import { useSplSession } from "@/hooks/useSplSession";
import { invalidatePlayerBrowserCaches } from "@/lib/frontend/browser-cache";
import { loadGroupedCardCollection } from "@/lib/frontend/player-data";
import { CardFilterInput } from "@/types/filters";
import { useCallback, useMemo } from "react";

/**
 * The player's card collection, grouped, loaded in the browser. When the
 * viewer is that player their SPL token is sent along; an expired/rejected
 * token logs them out through the session's 401 handling (AuthContext).
 */
export function usePlayerCardPP(
  player: string,
  cardFilters: CardFilterInput = {}
) {
  const filtersKey = useMemo(() => JSON.stringify(cardFilters), [cardFilters]);
  const hasPlayer = Boolean(player && player.trim() !== "");
  // Logging in/out changes what the collection includes for its owner.
  const viewer = useSplSession()?.username ?? "";

  const { data, loading, error, refetch } = useAsyncData(
    hasPlayer ? `card-pp|${player}|${viewer}|${filtersKey}` : null,
    () => loadGroupedCardCollection(player, cardFilters),
    { errorMessage: "Unknown error" }
  );

  const refetchPlayerCardPP = useCallback(
    (force: boolean = false) => {
      if (force && hasPlayer) invalidatePlayerBrowserCaches(player);
      void refetch();
    },
    [player, hasPlayer, refetch]
  );

  return {
    cardPPResult: error ? null : (data ?? null),
    loading,
    error: error ? `Could not load player collection: ${error}` : null,
    refetchPlayerCardPP,
  };
}
