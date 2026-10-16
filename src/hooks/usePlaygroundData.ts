"use client";

import { loadPlaygroundData } from "@/lib/frontend/player-data";
import { PlaygroundData } from "@/types/playground";

import { useAsyncData } from "./useAsyncData";

export function usePlaygroundData(playerName: string | null) {
  const { data, loading, error } = useAsyncData<PlaygroundData>(
    playerName,
    () => loadPlaygroundData(playerName as string),
    { errorMessage: "Failed to load playground data" }
  );

  return { data, loading, error };
}
