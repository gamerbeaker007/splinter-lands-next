"use client";

import { getPlayerDeeds } from "@/lib/backend/actions/player/deed-actions";
import { RawRegionDataResponse } from "@/types/RawRegionDataResponse";

import { useAsyncData } from "./useAsyncData";

export function usePlayerDeeds(playerName: string | null) {
  const { data, loading, error } = useAsyncData<RawRegionDataResponse>(
    playerName,
    getPlayerDeeds,
    "Failed to load deeds"
  );

  return { deeds: data, loading, error };
}
