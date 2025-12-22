"use client";

import {
  getPlayerTradeHubPosition,
  GroupedPlayerTradeHubPosition,
} from "@/lib/backend/actions/resources/trade-hub-actions";
import { useEffect, useState } from "react";

export function useTradeHubPositions(force: boolean = false) {
  const [groupedPlayerTradeHubPosition, setGroupedPlayerTradeHubPosition] =
    useState<GroupedPlayerTradeHubPosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getPlayerTradeHubPosition(force);
        if (mounted) {
          setGroupedPlayerTradeHubPosition(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Unknown error");
          setGroupedPlayerTradeHubPosition(null);
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
  }, [force]);

  return { groupedPlayerTradeHubPosition, loading, error };
}
