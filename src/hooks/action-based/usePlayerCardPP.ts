"use client";

import { getPlayerCardCollection as getPlayerCardCollectionGrouped } from "@/lib/backend/actions/player/collection-actions";
import { useAuth } from "@/lib/frontend/context/AuthContext";
import { CardFilterInput } from "@/types/filters";
import { GroupedCardRow } from "@/types/groupedCardRow";
import { useCallback, useEffect, useState, useTransition } from "react";

/**
 * Client-side hook for fetching player card collection using server actions
 * This replaces the old cookie/JWT-based approach with server actions
 * Automatically handles JWT expiration and triggers logout
 */
export function usePlayerCardPP(
  player: string,
  cardFilters: CardFilterInput = {}
) {
  const { logout } = useAuth();
  const [cardPPResult, setCardPPResult] = useState<GroupedCardRow[] | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchData = useCallback(
    async (force: boolean = false) => {
      if (!player || player.trim() === "") {
        setCardPPResult(null);
        setError("Player is required.");
        return null;
      }

      setError(null);

      try {
        const result = await getPlayerCardCollectionGrouped(
          player,
          cardFilters,
          force
        );
        setCardPPResult(result);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";

        // Handle expired authentication
        if (message === "AUTH_EXPIRED") {
          setError("Authentication expired. Please log in again.");
          // Trigger logout to clear all auth state
          logout();
          return null;
        }

        setError(`Could not load player collection: ${message}`);
        setCardPPResult(null);
        return null;
      }
    },
    [player, cardFilters, logout]
  );

  const refetchPlayerCardPP = useCallback(
    (force: boolean = false) => {
      startTransition(() => {
        void fetchData(force);
      });
    },
    [fetchData]
  );

  useEffect(() => {
    if (!player || player === "") {
      return;
    }

    startTransition(() => {
      void fetchData(false);
    });
  }, [player, cardFilters, fetchData]);

  return {
    cardPPResult,
    loading: isPending,
    error,
    refetchPlayerCardPP,
  };
}
