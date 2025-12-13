"use server";

import { SplCardDetails } from "@/types/splCardDetails";
import { getCachedCardDetailsData } from "../services/cardService";

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
