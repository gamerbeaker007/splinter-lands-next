import { Prisma } from "@/generated/prisma/client";
import { fetchRegionData } from "@/lib/backend/api/spl/spl-land-api";
import logger from "@/lib/backend/log/logger.server";
import { logError } from "@/lib/backend/log/logUtils";
import { prisma } from "@/lib/prisma";

import DeedUncheckedCreateInput = Prisma.DeedUncheckedCreateInput;
import WorksiteDetailUncheckedCreateInput = Prisma.WorksiteDetailUncheckedCreateInput;
import StakingDetailUncheckedCreateInput = Prisma.StakingDetailUncheckedCreateInput;

function safeDate(input: Date | string | null | undefined): Date | null {
  if (!input) return null;
  if (typeof input === "string") {
    if (input.startsWith("+")) return null;
    const parsed = new Date(input);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return isNaN(input.getTime()) ? null : input;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// Generic helper to insert in chunks with logging
async function createManyInChunks<T>(
  label: string,
  allItems: T[],
  createManyFn: (args: {
    data: T[];
    skipDuplicates?: boolean;
  }) => Promise<Prisma.BatchPayload>,
  chunkSize = 2000
) {
  if (allItems.length === 0) {
    logger.info(`📦 No ${label} to insert, skipping.`);
    return;
  }

  const chunks = chunk(allItems, chunkSize);
  logger.info(
    `📦 Inserting ${allItems.length} ${label} in ${chunks.length} chunks (size ~${chunkSize})...`
  );

  let totalInserted = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunkItems = chunks[i];
    const start = Date.now();

    const result = await createManyFn({
      data: chunkItems,
      skipDuplicates: true,
    });

    const inserted = result.count ?? 0;
    totalInserted += inserted;

    logger.info(
      `  ▶️ ${label} chunk ${i + 1}/${chunks.length} done in ${
        (Date.now() - start) / 1000
      }s, inserted: ${inserted}`
    );
  }

  logger.info(
    `✅ Finished inserting ${label}. Total inserted (non-duplicates): ${totalInserted}`
  );
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
              })
            )
          );

          allStakings.push(...staking_details);

          logger.info(`⌛ Region ${region}: ${deeds.length} deeds`);
        } catch (error) {
          logError(`❌ Region ${region} failed`, error);
        }
      })
    );
  }

  // Chunked inserts
  await createManyInChunks("deeds", allDeeds, (args) =>
    prisma.deed.createMany(args)
  );

  await createManyInChunks("worksites", allWorksites, (args) =>
    prisma.worksiteDetail.createMany(args)
  );

  await createManyInChunks("stakings", allStakings, (args) =>
    prisma.stakingDetail.createMany(args)
  );

  const end = Date.now();

  logger.info(`✅ Stored Deeds, Worksites Details and Staking Details ---`);
  logger.info(`Total time: ${(end - start) / 1000}s`);
}
