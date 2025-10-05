"use client";

import logger from "@/lib/frontend/log/logger.client";
import { CardFilterInput } from "@/types/filters";
import { GroupedCardRow } from "@/types/groupedCardRow";
import { useCallback, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useCsrfToken } from "../useCsrf";
import { useAuth } from "@/lib/frontend/context/AuthContext";

export function usePlayerCardPP(
  player: string,
  cardFilters: CardFilterInput = {},
) {
  const { user } = useAuth();
  const { getCsrfToken } = useCsrfToken();

  const [cardPPResult, setCardPPResult] = useState<GroupedCardRow[] | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlayerCardPP = useCallback(
    async (
      player: string,
      cardFilters: CardFilterInput,
      force: boolean,
    ): Promise<{ cards: GroupedCardRow[] }> => {
      const url = `/api/player/card/pp`;
      // Get spl_jwt_token from cookies if available
      const authHeader: Record<string, string> = {};
      const token = Cookies.get("jwt_token");
      if (token) {
        authHeader["Authorization"] = `Bearer ${token}`;
      }

      // Fetch CSRF token when needed (lazy loading)
      const csrfToken = await getCsrfToken();
      authHeader["X-CSRF-Token"] = csrfToken;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
        body: JSON.stringify({
          player,
          force,
          cardFilters,
        }),
      });

      return await res.json();
    },
    [getCsrfToken],
  );

  const refetchPlayerCardPP = useCallback(
    async (force: boolean = false) => {
      if (!player) {
        setCardPPResult(null);
        setError("Player is required.");
        return null;
      }

      setLoading(true);
      setError(null);
      try {
        const payload = await fetchPlayerCardPP(player, cardFilters, force);
        setCardPPResult(payload.cards as GroupedCardRow[]);
        return payload.cards as GroupedCardRow[];
      } catch (err) {
        logger.error("Failed to fetch player collection:", err);
        setError("Could not load player collection.");
        setCardPPResult(null);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [player, cardFilters, fetchPlayerCardPP],
  );

  useEffect(() => {
    // Only refetch if player is set and user is available
    if (!player || player === "") {
      return;
    }
    console.log("user in usePlayerCardPP", user);
    refetchPlayerCardPP(false);
  }, [player, cardFilters, user, refetchPlayerCardPP]);

  return {
    cardPPResult,
    loading,
    error,
    refetchPlayerCardPP,
  };
}
