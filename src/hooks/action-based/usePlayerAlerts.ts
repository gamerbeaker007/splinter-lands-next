"use client";

import { getPlayerCardAlerts } from "@/lib/backend/actions/player/alerts-actions";
import { CardAlerts } from "@/types/cardAlerts";
import { useEffect, useState } from "react";

export function usePlayerAlerts(player: string, force: boolean = false) {
  const [cardAlerts, setCardAlerts] = useState<CardAlerts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const alerts = await getPlayerCardAlerts(player, force);
        if (mounted) {
          setCardAlerts(alerts);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Unknown error");
          setCardAlerts(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [player, force]);

  return { cardAlerts, loading, error };
}
