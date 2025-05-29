import {Prisma} from '@/generated/prisma';
import { fetchRegionData } from '@/lib/api/spl/splLandAPI';
import DeedUncheckedCreateInput = Prisma.DeedUncheckedCreateInput;
import WorksiteDetailUncheckedCreateInput = Prisma.WorksiteDetailUncheckedCreateInput;
import StakingDetailUncheckedCreateInput = Prisma.StakingDetailUncheckedCreateInput;
import { prisma } from '@/lib/prisma';

function safeDate(input: Date | string | null | undefined): Date | null {
    if (!input) return null;

    if (typeof input === 'string') {
        if (input.startsWith('+')) return null;
        const parsed = new Date(input);
        return isNaN(parsed.getTime()) ? null : parsed;
    }

    return isNaN(input.getTime()) ? null : input;
}

async function saveDeeds(deeds: DeedUncheckedCreateInput[]) {
    for (const deed of deeds) {
        await prisma.deed.upsert({
            where: { deed_uid: deed.deed_uid },
            update: deed,
            create: deed,
        });
    }
}

async function saveWorksites(worksites: WorksiteDetailUncheckedCreateInput[]) {
    for (const ws of worksites) {
        await prisma.worksiteDetail.upsert({
            where: { deed_uid: ws.deed_uid },
            update: { ...ws, projected_end: safeDate(ws.projected_end) },
            create: { ...ws, projected_end: safeDate(ws.projected_end) },
        });
    }
}

async function saveStaking(stakings: StakingDetailUncheckedCreateInput[]) {
    for (const st of stakings) {
        await prisma.stakingDetail.upsert({
            where: { deed_uid: st.deed_uid },
            update: st,
            create: st,
        });
    }
}


async function processRegion(region: number) {
    try {
        console.log(`Fetch region data for ${region}`);
        const { deeds, worksite_details, staking_details } = await fetchRegionData(region);

        console.log(`Start saving region data for ${region}`);
        await Promise.all([
            (async () => {
                console.log(`Save region data - deeds - for ${region}`);
                await saveDeeds(deeds);
            })(),
            (async () => {
                console.log(`Save region data - worksites details - for ${region}`);
                await saveWorksites(worksite_details);
            })(),
            (async () => {
                console.log(`Save region data - staking details - for ${region}`);
                await saveStaking(staking_details);
            })(),
        ]);

        console.log(`✅ Region ${region} - ${deeds.length} deeds stored`);
    } catch (error) {
        if (error instanceof Error) {
            console.error(`❌ Failed to process region ${region}:`, error.message);
        } else {
            console.error(`❌ Failed to process region ${region}:`, error);
        }
    }
}

export async function fetchAndProcessRegionData(){
    const start = Date.now();

    // Step 1: Fetch and store all regions in parallel
    const regionNumbers = Array.from({ length: 151 }, (_, i) => i + 1);

    const concurrency = 10;
    for (let i = 0; i < regionNumbers.length; i += concurrency) {
        const batch = regionNumbers.slice(i, i + concurrency);
        await Promise.all(batch.map(region => processRegion(region)));
    }

    const mid = Date.now();

    // Step 2: Measure how long it takes to fetch all stored records
    const allDeedsStart = Date.now();
    const allDeeds = await prisma.deed.findMany();
    const allDeedsEnd = Date.now();

    console.log(`--- ✅ All Done ---`);
    console.log(`Stored ${allDeeds.length} deeds in ${(mid - start) / 1000}s`);
    console.log(`Fetched all from DB in ${(allDeedsEnd - allDeedsStart) / 1000}s`);
}
