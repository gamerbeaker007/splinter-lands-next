"use client";

import { useEffect, useState } from "react";
import logger from "@/lib/frontend/log/logger.client";
import { CardAlerts } from "@/types/cardAlerts";

export function usePlayerCardAlerts(player: string, force = false) {
  const [cardAlerts, setCardAlerts] = useState<CardAlerts | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!player) {
        setCardAlerts(null);
        setError("Player is required.");
        return null;
      }

      try {
        setLoading(true);
        setError(null);
        const url = `/api/player/card/alerts`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ player, force }),
        });

        const payload = await res.json().catch(() => ({}));

        if (!res.ok) {
          const msg = payload?.error || `Request failed (${res.status})`;
          throw new Error(msg);
        }

        setCardAlerts(payload as CardAlerts);
        return payload as CardAlerts;
      } catch (err) {
        logger.error("Failed to fetch player collection:", err);
        setError("Could not load player collection.");
        setCardAlerts(null);
        return null;
      } finally {
        setLoading(false);
      }
    })();
  }, [force, player]);

  return { cardAlerts, loading, error };
}
