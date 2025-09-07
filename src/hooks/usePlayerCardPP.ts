"use client";

import logger from "@/lib/frontend/log/logger.client";
import { CardFilterInput } from "@/types/filters";
import { GroupedCardRow } from "@/types/groupedCardRow";
import { useCallback, useEffect, useState } from "react";

export function usePlayerCardPP(
  player: string,
  cardFilters: CardFilterInput = {},
) {
  const [cardPPResult, setCardPPResult] = useState<GroupedCardRow[] | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchPlayerCardPP(
    player: string,
    cardFilters: CardFilterInput,
    force: boolean,
  ): Promise<{ cards: GroupedCardRow[] }> {
    const url = `/api/player/card/pp`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ player, force, cardFilters }),
    });

    return await res.json();
  }

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
    [player, cardFilters],
  );

  useEffect(() => {
    if (!player || player === "") {
      return;
    }

    refetchPlayerCardPP(false);
  }, [player, cardFilters, refetchPlayerCardPP]);

  return {
    cardPPResult,
    loading,
    error,
    refetchPlayerCardPP,
  };
}
