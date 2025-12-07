"use server";
import { prisma } from "@/lib/prisma";
import { BurnCardsDataPoint } from "@/types/burn";

/**
 * Get the daily burned token balances.
 */

export async function getDailyBurnedBalances(): Promise<{
  data: BurnCardsDataPoint[];
}> {
  const data = await prisma.dailyBurnedTokenBalance.findMany({
    orderBy: { date: "desc" },
  });
  const burnDataPoints: BurnCardsDataPoint[] = data.map((d) => ({
    date: d.date.toISOString().split("T")[0],
    token: d.token,
    balance: Number(d.balance),
  }));

  return { data: burnDataPoints };
}
