import { prisma } from '@/lib/prisma';
import {Active} from "@/generated/prisma";
import {getLastUpdate} from "@/lib/cache/utils";

let cachedActiveData: Active[] | null = null;
let cachedTimestamp: Date | null = null;

export async function getAllActiveData(): Promise<Active[]> {
    const lastUpdate = await getLastUpdate();
    if (!cachedActiveData || !cachedTimestamp || cachedTimestamp < lastUpdate) {
        console.log('Refreshing active data cache...');
        cachedActiveData = await prisma.active.findMany({
            orderBy: {
                date: 'asc',
            },

        });
        cachedTimestamp = lastUpdate;
    }

    return cachedActiveData;
}

export async function getLatestActiveEntry(): Promise<Active | null> {
    const all = await getAllActiveData();
    return all.at(-1) ?? null;
}
