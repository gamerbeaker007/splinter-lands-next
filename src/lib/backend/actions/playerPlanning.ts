"use server";

import { RawRegionDataResponse } from "@/types/RawRegionDataResponse";
import { SplCardDetails } from "@/types/splCardDetails";
import { SplPlayerCardCollection } from "@/types/splPlayerCardDetails";
import { cacheLife } from "next/cache";
import { fetchCardDetails } from "../api/spl/spl-base-api";
import {
  getCachedPlayerCardCollection,
  getCachedPlayerData,
} from "../services/playerService";
import { getCachedCardDetailsData } from "../services/cardService";

/**
 * Get player card collection with caching.
 * Uses hourly cache since player collections can change.
 */
export async function getPlayerCollection(
  player: string
): Promise<SplPlayerCardCollection[]> {
  return await getCachedPlayerCardCollection(player);
}

/**
 * Get player land deeds with caching.
 * Uses hourly cache since player deeds can change.
 */
export async function getPlayerDeeds(
  player: string
): Promise<RawRegionDataResponse> {
  return await getCachedPlayerData(player);
}

/**
 * Get card details with caching.
 * Uses daily cache since card details rarely change.
 */
export async function getCardDetails(): Promise<SplCardDetails[]> {
  const result = await getCachedCardDetailsData();
  if (!result) {
    throw new Error("No card details found");
  }
  return result;
}
