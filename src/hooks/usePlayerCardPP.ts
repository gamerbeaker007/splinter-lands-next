"use client";

import logger from "@/lib/frontend/log/logger.client";
import { CardPPResult } from "@/types/GroupedCardRow";
import { CardFilterInput } from "@/types/filters";
import { useEffect, useState } from "react";

export function usePlayerCardPP(
  player: string,
  force = false,
  cardFilters: CardFilterInput = {},
) {
  const [cardPPResult, setCardPPResult] = useState<CardPPResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!player) {
        setCardPPResult(null);
        setError("Player is required.");
        return null;
      }

      try {
        setLoading(true);
        setError(null);
        const url = `/api/player/card/pp`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ player, force, cardFilters }),
        });

        const payload = await res.json().catch(() => ({}));

        if (!res.ok) {
          const msg = payload?.error || `Request failed (${res.status})`;
          throw new Error(msg);
        }

        setCardPPResult(payload as CardPPResult);
        return payload as CardPPResult;
      } catch (err) {
        logger.error("Failed to fetch player collection:", err);
        setError("Could not load player collection.");
        setCardPPResult(null);
        return null;
      } finally {
        setLoading(false);
      }
    })();
  }, [player, force, cardFilters]);

  return { cardPPResult, loading, error };
}
