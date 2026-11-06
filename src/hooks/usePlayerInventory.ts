"use client";

import { loadPlayerInventory } from "@/lib/frontend/player-data";
import { SplInventory } from "@/types/spl/inventory";

import { useAsyncData } from "./useAsyncData";

export function usePlayerInventory(playerName: string | null) {
  const { data, loading } = useAsyncData<SplInventory[]>(
    playerName,
    () => loadPlayerInventory(playerName as string),
    { errorMessage: "Failed to load inventory" }
  );

  return { inventory: data ?? [], loadingInventory: loading };
}
