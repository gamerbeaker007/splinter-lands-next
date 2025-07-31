import logger from "@/lib/backend/log/logger.server";
import { logError } from "@/lib/backend/log/logUtils";
import { prisma } from "@/lib/prisma";
import { calcCosts } from "@/lib/shared/costCalc";
import {
  MULTIPLE_CONSUMING_RESOURCES,
  NATURAL_RESOURCES,
} from "@/lib/shared/statics";

async function computeAndStoreResource(
  date: Date,
  resource: string,
  worksite_type?: string,
) {
  const key = worksite_type ? `${resource} ${worksite_type}` : resource;

  try {
    const deeds = await prisma.deed.findMany({
      where: {
        worksiteDetail: {
          token_symbol: resource,
          ...(worksite_type ? { worksite_type } : {}),
        },
      },
      include: {
        worksiteDetail: true,
        stakingDetail: true,
      },
    });

    let totalHarvest = 0;
    let totalBasePP = 0;
    let totalRewards = 0;

    for (const deed of deeds) {
      const { stakingDetail, worksiteDetail } = deed;
      if (!stakingDetail || !worksiteDetail) continue;

      totalHarvest += stakingDetail.total_harvest_pp ?? 0;
      totalBasePP += stakingDetail.total_base_pp_after_cap ?? 0;
      totalRewards += worksiteDetail.rewards_per_hour ?? 0;
    }

    const totalEfficiency =
      deeds.reduce((acc, deed) => {
        const se = deed.worksiteDetail?.site_efficiency ?? 0;
        const pp = deed.stakingDetail?.total_base_pp_after_cap ?? 0;
        return acc + se * pp;
      }, 0) || 0;

    const costs = calcCosts(resource, totalEfficiency, 1); // pass efficiency-weighted PP

    const data = {
      total_harvest_pp: totalHarvest,
      total_base_pp_after_cap: totalBasePP,
      rewards_per_hour: totalRewards,
      ...costs,
    };

    await prisma.resourceTracking.upsert({
      where: { date_token_symbol: { date, token_symbol: key } },
      create: { date, token_symbol: key, ...data },
      update: data,
    });
  } catch (err) {
    logError(`❌ Failed to compute resource for ${key}`, err);
  }
}

export async function computeAndStoreResourceProduction(today: Date) {
  logger.info(`⌛ --- Start computeAndStoreResourceProduction...`);

  try {
    await Promise.all(
      [...NATURAL_RESOURCES, ...Array.from(MULTIPLE_CONSUMING_RESOURCES)].map(
        (resource) => computeAndStoreResource(today, resource),
      ),
    );

    await computeAndStoreResource(today, "TAX", "CASTLE");
    await computeAndStoreResource(today, "TAX", "KEEP");

    logger.info(
      `✅ Stored resource production for ${today.toISOString().split("T")[0]}`,
    );
  } catch (err) {
    logError("❌ Resource production batch failed", err);
  }
}
