import logger from "@/lib/backend/log/logger.server";
import { prisma } from "@/lib/prisma";

export async function computeAndStoreDailyActiveMetrics(today: Date) {
  logger.info(`⌛ --- Start computeAndStoreDailyActiveMetrics...`);

  const [active_based_on_in_use, active_based_on_pp] = await Promise.all([
    prisma.deed.count({
      where: { in_use: true },
    }),
    prisma.stakingDetail.count({
      where: {
        total_harvest_pp: {
          gt: 0,
        },
      },
    }),
  ]);

  await prisma.active.upsert({
    where: { date: today },
    update: {
      active_based_on_pp,
      active_based_on_in_use,
    },
    create: {
      date: today,
      active_based_on_pp,
      active_based_on_in_use,
    },
  });

  logger.info(
    `✅ Stored active metrics for ${today.toISOString().split("T")[0]}`,
  );
}
