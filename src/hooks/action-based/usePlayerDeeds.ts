"use client";

import { getPlayerDeeds } from "@/lib/backend/actions/playerPlanning";
import { RawRegionDataResponse } from "@/types/RawRegionDataResponse";
import { useEffect, useState } from "react";

export function usePlayerDeeds(playerName: string | null) {
  const [deeds, setDeeds] = useState<RawRegionDataResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!playerName) {
      setDeeds(null);
      setError(null);
      return;
    }

    const fetchDeeds = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getPlayerDeeds(playerName);
        setDeeds(data);
      } catch (err) {
        console.error("Failed to fetch player deeds:", err);
        setError(err instanceof Error ? err.message : "Failed to load deeds");
        setDeeds(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDeeds();
  }, [playerName]);

  return { deeds, loading, error };
}
