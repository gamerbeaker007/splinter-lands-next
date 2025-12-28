"use server";
import { SplInventory } from "@/types/spl/inventory";
import { cacheLife } from "next/cache";
import { fetchPlayerInventory } from "../../api/spl/spl-base-api";

/**
 * Get resource prices with hourly cache.
 */
export async function getPlayerInventory(
  player: string
): Promise<SplInventory[]> {
  "use cache";
  cacheLife("hours");

  const data = await fetchPlayerInventory(player);
  return data;
}
