"use server";

import { prisma } from "@/lib/prisma";

/**
 * Returns the total donations already paid today (UTC day) for the given player,
 * summed across both regular harvests and mythic harvests.
 * Used to enforce the per-symbol daily donation cap before planning a new run.
 */
export async function getTodayPaidDonations(
  username: string
): Promise<Record<string, number>> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const [harvestRow, mythicRow] = await Promise.all([
    prisma.landHarvestLog.findUnique({
      where: { date_player: { date: today, player: username } },
      select: { donations_json: true },
    }),
    prisma.landMythicHarvestLog.findUnique({
      where: { date_player: { date: today, player: username } },
      select: { donations_json: true },
    }),
  ]);

  const result: Record<string, number> = {};
  for (const row of [harvestRow, mythicRow]) {
    if (!row) continue;
    for (const [sym, amount] of Object.entries(
      (row.donations_json as Record<string, number>) ?? {}
    )) {
      if (amount > 0) result[sym] = (result[sym] ?? 0) + amount;
    }
  }
  return result;
}
