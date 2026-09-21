"use client";

import { getPlaygroundData } from "@/lib/backend/actions/player/playground-actions";
import { PlaygroundData } from "@/types/playground";

import { useAsyncData } from "./useAsyncData";

export function usePlaygroundData(playerName: string | null) {
  const { data, loading, error } = useAsyncData<PlaygroundData>(
    playerName,
    getPlaygroundData,
    "Failed to load playground data"
  );

  return { data, loading, error };
}
