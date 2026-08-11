"use client";

import { getPlayerCardCollection as getPlayerCardCollectionGrouped } from "@/lib/backend/actions/player/collection-actions";
import { useAuth } from "@/lib/frontend/context/AuthContext";
import { CardFilterInput } from "@/types/filters";
import { GroupedCardRow } from "@/types/groupedCardRow";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

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

  // Monotonically increasing id so only the most recent request may write
  // state. Guards against stale responses landing out of order when the
  // player/filters change while a request is still in flight.
  const requestIdRef = useRef(0);

  const fetchData = useCallback(
    async (force: boolean = false) => {
      const requestId = ++requestIdRef.current;
      const isStale = () => requestIdRef.current !== requestId;

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
        if (isStale()) return result;
        setCardPPResult(result);
        return result;
      } catch (err) {
        if (isStale()) return null;
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
