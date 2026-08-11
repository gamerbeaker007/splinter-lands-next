"use client";

import { getPlayerCollection } from "@/lib/backend/actions/player/collection-actions";
import { SplPlayerCardCollection } from "@/types/splPlayerCardDetails";
import { useEffect, useState } from "react";

export function usePlayerCollection(playerName: string | null) {
  const [collection, setCollection] = useState<
    SplPlayerCardCollection[] | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!playerName) {
      setCollection(null);
      setError(null);
      return;
    }

    let cancelled = false;
    const fetchCollection = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getPlayerCollection(playerName);
        if (cancelled) return;
        setCollection(data);
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to fetch player collection:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load collection"
        );
        setCollection(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchCollection();
    return () => {
      cancelled = true;
    };
  }, [playerName]);

  return { collection, loading, error };
}
