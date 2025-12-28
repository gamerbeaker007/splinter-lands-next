"use client";

import { getPlaygroundData } from "@/lib/backend/actions/player/playground-actions";
import { PlaygroundData } from "@/types/playground";
import { useEffect, useState } from "react";

export function usePlaygroundData(playerName: string | null) {
  const [data, setData] = useState<PlaygroundData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!playerName) {
      setData(null);
      setError(null);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const playgroundData = await getPlaygroundData(playerName);
        setData(playgroundData);
      } catch (err) {
        console.error("Failed to fetch playground data:", err);
        setError(err instanceof Error ? err.message : "Failed to load data");
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [playerName]);

  return { data, loading, error };
}
