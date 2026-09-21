"use client";

import { getPlayerInventory } from "@/lib/backend/actions/player/inventory-actions";
import { SplInventory } from "@/types/spl/inventory";

import { useAsyncData } from "./useAsyncData";

export function usePlayerInventory(playerName: string | null) {
  const { data, loading } = useAsyncData<SplInventory[]>(
    playerName,
    getPlayerInventory,
    "Failed to load inventory"
  );

  return { inventory: data ?? [], loadingInventory: loading };
}
