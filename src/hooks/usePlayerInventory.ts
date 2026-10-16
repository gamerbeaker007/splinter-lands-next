"use client";

import { splBrowser } from "@/lib/frontend/spl-browser-api";
import { SplInventory } from "@/types/spl/inventory";

import { useAsyncData } from "./useAsyncData";

export function usePlayerInventory(playerName: string | null) {
  const { data, loading } = useAsyncData<SplInventory[]>(
    playerName,
    () => splBrowser.fetchPlayerInventory(playerName as string),
    { errorMessage: "Failed to load inventory" }
  );

  return { inventory: data ?? [], loadingInventory: loading };
}
