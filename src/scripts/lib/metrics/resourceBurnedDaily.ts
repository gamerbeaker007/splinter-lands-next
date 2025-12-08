import { Prisma } from "@/generated/prisma/client";
import { fetchBurnedBalances } from "@/lib/backend/api/spl/spl-base-api";
import logger from "@/lib/backend/log/logger.server";
import { prisma } from "@/lib/prisma";

type DailyBurnedTokenBalanceInput = Prisma.DailyBurnedTokenBalanceCreateInput;

export async function computeAndStoreBurnedResources(today: Date) {
  logger.info(`⌛ --- Start computeAndStoreBurnedResources...`);

  const burnedBalances = await fetchBurnedBalances();

  const data: DailyBurnedTokenBalanceInput[] = burnedBalances.reduce(
    (acc, balance) => {
      balance.balance = balance.balance || "0";

      acc.push({
        date: today,
        player: balance.player,
        token: balance.token,
        balance: balance.balance,
      });
      return acc;
    },
    [] as DailyBurnedTokenBalanceInput[]
  );

  // Check if data exists for this date
  const existingCount = await prisma.dailyBurnedTokenBalance.count({
    where: { date: today },
  });

  if (existingCount === 0) {
    await prisma.dailyBurnedTokenBalance.createMany({ data });
    logger.info(`✅ Stored ${data.length} burned resources`);
  } else {
    logger.info(`⏭️  Skipped - data already exists for this date`);
  }
  logger.info(
    `✅ Stored burned resources for ${today.toISOString().split("T")[0]}`
  );
}
