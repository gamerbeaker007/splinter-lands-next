"use server";

import { shouldApplyFee } from "@/lib/backend/services/feeExemptionService";
import { prisma } from "@/lib/prisma";

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

/**
 * Returns the total fees already paid today (UTC day) for the given player,
 * summed across both regular harvests and mythic harvests.
 * Used to enforce the per-symbol daily fee cap before planning a new run.
 */
export async function getTodayPaidFees(
  username: string
): Promise<Record<string, number>> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const [harvestRow, mythicRow] = await Promise.all([
    prisma.landHarvestLog.findUnique({
      where: { date_player: { date: today, player: username } },
      select: { fees_json: true },
    }),
    prisma.landMythicHarvestLog.findUnique({
      where: { date_player: { date: today, player: username } },
      select: { fees_json: true },
    }),
  ]);

  const result: Record<string, number> = {};
  for (const row of [harvestRow, mythicRow]) {
    if (!row) continue;
    for (const [sym, amount] of Object.entries(
      (row.fees_json as Record<string, number>) ?? {}
    )) {
      if (amount > 0) result[sym] = (result[sym] ?? 0) + amount;
    }
  }
  return result;
}
