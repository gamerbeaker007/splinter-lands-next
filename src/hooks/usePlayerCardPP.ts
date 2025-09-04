"use client";

import { useEffect, useState } from "react";
import logger from "@/lib/frontend/log/logger.client";
import { CardAlerts } from "@/app/api/player/card/alerts/route";
import { CardPPResult } from "@/app/api/player/card/pp/route";
import { CardFilterInput } from "@/types/filters";

export function usePlayerCardPP(
  player: string,
  force = false,
  filters: CardFilterInput = {},
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
        console.log("Give Filter: ", filters);
        setLoading(true);
        setError(null);
        const url = `/api/player/card/pp`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ player, force, filters }),
        });

        const payload = await res.json().catch(() => ({}));

        if (!res.ok) {
          const msg = payload?.error || `Request failed (${res.status})`;
          throw new Error(msg);
        }

        setCardPPResult(payload as CardPPResult);
        return payload as CardAlerts;
      } catch (err) {
        logger.error("Failed to fetch player collection:", err);
        setError("Could not load player collection.");
        setCardPPResult(null);
        return null;
      } finally {
        setLoading(false);
      }
    })();
  }, [player, force, filters]);

  return { cardPPResult, loading, error };
}
