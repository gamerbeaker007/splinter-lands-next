import { prisma } from '@/lib/prisma';

export async function computeAndStoreDailyActiveMetrics(today: Date) {
    const [activeBasedOnInUse, activeBasedOnPp] = await Promise.all([
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
            activeBasedOnInUse,
            activeBasedOnPp,
        },
        create: {
            date: today,
            activeBasedOnInUse,
            activeBasedOnPp,
        },
    });

    console.log(`📊 Active metrics saved for ${today.toISOString().split('T')[0]}`);
}
