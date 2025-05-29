import { Prisma } from '@/generated/prisma';
import { fetchRegionData } from '@/lib/api/spl/splLandAPI';
import { prisma } from '@/lib/prisma';

import DeedUncheckedCreateInput = Prisma.DeedUncheckedCreateInput;
import WorksiteDetailUncheckedCreateInput = Prisma.WorksiteDetailUncheckedCreateInput;
import StakingDetailUncheckedCreateInput = Prisma.StakingDetailUncheckedCreateInput;

function safeDate(input: Date | string | null | undefined): Date | null {
  if (!input) return null;
  if (typeof input === 'string') {
    if (input.startsWith('+')) return null;
    const parsed = new Date(input);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return isNaN(input.getTime()) ? null : input;
}

export async function fetchAndProcessRegionData() {
  const start = Date.now();

  // Step 0: Wipe all tables
  console.log(`🧹 Clearing existing data...`);
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

    await Promise.all(batch.map(async (region) => {
      try {
        console.log(`🌍 Fetching region ${region}`);
        const { deeds, worksite_details, staking_details } = await fetchRegionData(region);
        allDeeds.push(...deeds);
        allWorksites.push(
          ...worksite_details.map(ws => ({
            ...ws,
            projected_end: safeDate(ws.projected_end),
          }))
        );
        allStakings.push(...staking_details);
        console.log(`⌛ Region ${region}: ${deeds.length} deeds`);
      } catch (error) {
        console.error(`❌ Region ${region} failed:`, error instanceof Error ? error.message : error);
      }
    }));
  }

  console.log(`📦 Inserting ${allDeeds.length} deeds...`);
  await prisma.deed.createMany({ data: allDeeds, skipDuplicates: true });

  console.log(`📦 Inserting ${allWorksites.length} worksites...`);
  await prisma.worksiteDetail.createMany({ data: allWorksites, skipDuplicates: true });

  console.log(`📦 Inserting ${allStakings.length} stakings...`);
  await prisma.stakingDetail.createMany({ data: allStakings, skipDuplicates: true });

  const end = Date.now();

  console.log(`--- ✅ All Done ---`);
  console.log(`Total time: ${(end - start) / 1000}s`);
}
