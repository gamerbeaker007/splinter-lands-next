import { Prisma } from '@/generated/prisma';
import { getLandResourcesPools } from '@/lib/api/spl/splLandAPI';
import {getPrices} from "@/lib/api/spl/splPricesAPI";
import {prisma} from "@/lib/prisma";

export async function computeAndStoreResourceHubMetrics(today: Date) {
    console.log(`⌛ --- Start computeAndStoreResourceHubMetrics...`);

    const resources = await getLandResourcesPools();
    if (!resources || resources.length === 0) {
        console.warn('⚠️ No land resource pool data available.');
        return;
    }

    const prices = await getPrices();
    const decUSDPrice = prices?.dec ?? 0;

    const grainResource = resources.find((r: { token_symbol: string; }) => r.token_symbol === 'GRAIN');
    const grainPrice = parseFloat(grainResource?.resource_price ?? '0');


    const dataToInsert = resources.map((row: Prisma.ResourceHubMetricsCreateInput) => {
        const resourcePrice = row.resource_price;
        const { grainEquivalent, factor } = calculateGrainEquivalentAndFactor(resourcePrice, grainPrice);
        return {
            date: today,
            id: row.id,
            token_symbol: row.token_symbol,
            resource_quantity: row.resource_quantity,
            resource_volume: row.resource_volume,
            resource_volume_1: row.resource_volume_1,
            resource_volume_30: row.resource_volume_30,
            resource_price: row.resource_price,
            dec_quantity: row.dec_quantity,
            dec_volume: row.dec_volume,
            dec_volume_1: row.dec_volume_1,
            dec_volume_30: row.dec_volume_30,
            dec_price: row.dec_price,
            total_shares: row.total_shares,
            created_date: row.created_date,
            last_updated_date: row.last_updated_date,
            dec_usd_value: decUSDPrice,
            grain_equivalent: grainEquivalent,
            factor: factor,
        };
    });

    // Optional: delete today's existing entries to avoid duplicates
    await prisma.resourceHubMetrics.deleteMany({ where: { date: today } });

    await prisma.resourceHubMetrics.createMany({
        data: dataToInsert,
        skipDuplicates: true,
    });

    console.log(`✅ Stored resource hub metrics for ${dataToInsert.length} tokens on ${today.toISOString().split('T')[0]}`);
}


function calculateGrainEquivalentAndFactor(resourcePrice: number, grainPrice: number) {
    if (grainPrice <= 0) {
        console.warn('⚠️ Grain price is zero or invalid. Defaulting to 0 for equivalents.');
        return { grainEquivalent: 0, factor: 0 };
    }
    const grainEquivalent = resourcePrice / grainPrice;
    const factor = 1 / grainEquivalent;
    return { grainEquivalent, factor };
}
