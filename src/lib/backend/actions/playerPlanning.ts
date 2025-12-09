"use server";

import { RawRegionDataResponse } from "@/types/RawRegionDataResponse";
import { SplCardDetails } from "@/types/splCardDetails";
import { SplPlayerCardCollection } from "@/types/splPlayerCardDetails";
import { cacheLife } from "next/cache";
import {
  fetchCardDetails,
  fetchPlayerCardCollection,
} from "../api/spl/spl-base-api";
import { fetchRegionDataPlayer } from "../api/spl/spl-land-api";

/**
 * Get player card collection with caching.
 * Uses hourly cache since player collections can change.
 */
export async function getPlayerCollection(
  player: string
): Promise<SplPlayerCardCollection[]> {
  "use cache";
  cacheLife("hours");

  return await fetchPlayerCardCollection(player, true);
}

/**
 * Get player land deeds with caching.
 * Uses hourly cache since player deeds can change.
 */
export async function getPlayerDeeds(
  player: string
): Promise<RawRegionDataResponse> {
  "use cache";
  cacheLife("hours");

  return await fetchRegionDataPlayer(player);
}

/**
 * Get card details with caching.
 * Uses daily cache since card details rarely change.
 */
export async function getCardDetails(): Promise<SplCardDetails[]> {
  "use cache";
  cacheLife("days");

  const result = await fetchCardDetails();
  if (!result) {
    throw new Error("No card details found");
  }
  return result;
}
