import {prisma} from "@/lib/prisma";

let lastCheckedAt: Date | null = null;
let cachedLastUpdate: Date | null = null;

export async function getLastUpdate(forceRefresh = false): Promise<Date> {
    const now = new Date();
    const shouldRefresh =
        forceRefresh ||
        !cachedLastUpdate ||
        !lastCheckedAt ||
        now.getTime() - lastCheckedAt.getTime() > 2 * 60 * 1000; // refresh every 5 minutes

    if (shouldRefresh) {
        const latest = await prisma.lastUpdate.findFirst();
        if (!latest) throw new Error('lastUpdate not found');
        cachedLastUpdate = latest.updatedAt;
        lastCheckedAt = now;
    }

    return cachedLastUpdate!;
}
