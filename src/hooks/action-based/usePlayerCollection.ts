"use client";

import { getPlayerCollection } from "@/lib/backend/actions/playerPlanning";
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

    const fetchCollection = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getPlayerCollection(playerName);
        setCollection(data);
      } catch (err) {
        console.error("Failed to fetch player collection:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load collection"
        );
        setCollection(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCollection();
  }, [playerName]);

  return { collection, loading, error };
}
