"use client";

import { loadPlayerRegionRaw } from "@/lib/frontend/player-data";
import { RawRegionDataResponse } from "@/types/RawRegionDataResponse";

import { useAsyncData } from "./useAsyncData";

export function usePlayerDeeds(playerName: string | null) {
  const { data, loading, error } = useAsyncData<RawRegionDataResponse>(
    playerName,
    () => loadPlayerRegionRaw(playerName as string),
    { errorMessage: "Failed to load deeds" }
  );

  return { deeds: data, loading, error };
}
