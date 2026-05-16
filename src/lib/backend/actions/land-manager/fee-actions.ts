"use server";

import { shouldApplyFee } from "@/lib/backend/services/feeExemptionService";

/**
 * Returns the subset of the given region numbers where the service fee applies
 * for the specified player. The exemption list lives exclusively on the server
 * so it is never exposed in the client bundle.
 */
export async function getFeeApplicableRegionNumbers(
  username: string,
  regionNumbers: number[]
): Promise<number[]> {
  return regionNumbers.filter((n) => shouldApplyFee(username, n));
}
