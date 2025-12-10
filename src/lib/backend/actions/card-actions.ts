import { SplCardDetails } from "@/types/splCardDetails";
import { cacheLife } from "next/cache";
import { fetchCardDetails } from "../api/spl/spl-base-api";

/**
 * Get card details with daily cache.
 */
export async function getPlanningCardDetails(): Promise<SplCardDetails[]> {
  "use cache";
  cacheLife("days");

  const result = await fetchCardDetails();
  if (!result) {
    throw new Error("No card details found");
  }
  return result;
}
