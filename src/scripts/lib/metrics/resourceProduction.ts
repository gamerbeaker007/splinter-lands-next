import {prisma} from "@/lib/prisma";
import {calcCosts} from "@/scripts/lib/utils/productionCosts";
import {MULTIPLE_CONSUMING_RESOURCES, NATURAL_RESOURCES} from "@/scripts/lib/utils/statics";




async  function  computeAndStoreResource(date: Date, resource: string, worksite_type?: string){
    const key = worksite_type ? `${resource}_${worksite_type}` : resource;

    try {
        const worksiteWhere = Object.assign(
            { token_symbol: resource },
            worksite_type ? { worksite_type } : {}
        );

        const stakingSums = await prisma.stakingDetail.aggregate({
            where: {
                deed: {
                    worksiteDetail: worksiteWhere,
                },
            },
            _sum: {
                total_harvest_pp: true,
                total_base_pp_after_cap: true,
            },
        });

        const worksiteRewards = await prisma.worksiteDetail.aggregate({
            where: worksiteWhere,
            _sum: {
                rewards_per_hour: true,
            },
        });

        const totalHarvest = stakingSums._sum.total_harvest_pp ?? 0;
        const totalBasePP = stakingSums._sum.total_base_pp_after_cap ?? 0;
        const totalRewards = worksiteRewards._sum.rewards_per_hour ?? 0;

        const costs = calcCosts(resource, totalBasePP);

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
        console.error(`❌ Failed to compute resource for ${key}`, err);
    }

}

export async function computeAndStoreResourceProduction(today: Date) {
    console.log(`⌛ --- Start computeAndStoreResourceProduction...`);
    
    try {
        await Promise.all([
            ...NATURAL_RESOURCES,
            ...Array.from(MULTIPLE_CONSUMING_RESOURCES),
        ].map(resource => computeAndStoreResource(today, resource)));

        await computeAndStoreResource(today, 'TAX', 'CASTLE');
        await computeAndStoreResource(today, 'TAX', 'KEEP');

        console.log(`✅ Stored resource production for ${today.toISOString().split('T')[0]}`);
    } catch (err) {
        console.error('❌ Resource production batch failed', err);
    }
}
