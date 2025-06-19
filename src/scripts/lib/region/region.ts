import { Prisma } from "@/generated/prisma";
import { fetchRegionData } from "@/lib/backend/api/spl/spl-land-api";
import { prisma } from "@/lib/prisma";

import DeedUncheckedCreateInput = Prisma.DeedUncheckedCreateInput;
import WorksiteDetailUncheckedCreateInput = Prisma.WorksiteDetailUncheckedCreateInput;
import StakingDetailUncheckedCreateInput = Prisma.StakingDetailUncheckedCreateInput;
import { logger } from "@/lib/backend/log/logger";
import { logError } from "@/lib/backend/log/logUtils";

function safeDate(input: Date | string | null | undefined): Date | null {
  if (!input) return null;
  if (typeof input === "string") {
    if (input.startsWith("+")) return null;
    const parsed = new Date(input);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return isNaN(input.getTime()) ? null : input;
}

export async function fetchAndProcessRegionData() {
  const start = Date.now();

  // Step 0: Wipe all tables
  logger.info(`🧹 Clearing existing data...`);
  await prisma.stakingDetail.deleteMany();
  await prisma.worksiteDetail.deleteMany();
  await prisma.deed.deleteMany();

  const regionNumbers = Array.from({ length: 151 }, (_, i) => i + 1);

  const allDeeds: DeedUncheckedCreateInput[] = [];
  const allWorksites: WorksiteDetailUncheckedCreateInput[] = [];
  const allStakings: StakingDetailUncheckedCreateInput[] = [];

  const concurrency = 10;
  for (let i = 0; i < regionNumbers.length; i += concurrency) {
    const batch = regionNumbers.slice(i, i + concurrency);

    await Promise.all(
      batch.map(async (region) => {
        try {
          const { deeds, worksite_details, staking_details } =
            await fetchRegionData(region);
          allDeeds.push(...deeds);
          allWorksites.push(
            ...worksite_details.map(
              (ws: WorksiteDetailUncheckedCreateInput) => ({
                ...ws,
                projected_end: safeDate(ws.projected_end),
              }),
            ),
          );
          allStakings.push(...staking_details);
          logger.info(`⌛ Region ${region}: ${deeds.length} deeds`);
        } catch (error) {
          logError(`❌ Region ${region} failed`, error);
        }
      }),
    );
  }

  logger.info(`📦 Inserting ${allDeeds.length} deeds...`);
  await prisma.deed.createMany({ data: allDeeds, skipDuplicates: true });

  logger.info(`📦 Inserting ${allWorksites.length} worksites...`);
  await prisma.worksiteDetail.createMany({
    data: allWorksites,
    skipDuplicates: true,
  });

  logger.info(`📦 Inserting ${allStakings.length} stakings...`);
  await prisma.stakingDetail.createMany({
    data: allStakings,
    skipDuplicates: true,
  });

  const end = Date.now();

  logger.info(`✅ Stored Deeds, Worksites Details and Staking Details ---`);
  logger.info(`Total time: ${(end - start) / 1000}s`);
}
