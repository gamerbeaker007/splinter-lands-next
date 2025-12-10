import { getCachedRegionDataSSR } from "@/lib/backend/api/internal/deed-data";
import { logError } from "@/lib/backend/log/logUtils";
import { getCachedStakedAssets } from "@/lib/backend/services/playerService";
import {
  enrichWithProductionInfo,
  enrichWithProgressInfo,
} from "@/lib/backend/services/regionService";
import { getCachedResourcePrices } from "@/lib/backend/services/resourceService";
import { filterDeeds, sortDeeds } from "@/lib/filters";
import { FilterInput } from "@/types/filters";
import pLimit from "p-limit";

const limit = pLimit(5);
const MIN_INTERVAL_MS = 15;
let nextAvailableTime = Date.now();

export async function POST(req: Request) {
  try {
    const filters: FilterInput = await req.json();
    const deeds = await getCachedRegionDataSSR();
    const deedsFiltered = filterDeeds(deeds, filters);
    const prices = await getCachedResourcePrices();
    const enriched1 = await enrichWithProgressInfo(deedsFiltered);
    const enrichedDeeds = await enrichWithProductionInfo(enriched1, prices);

    const sortedDeeds = sortDeeds(enrichedDeeds, filters.sorting);

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        let index = 0;

        // Wrap jobs with concurrency
        const jobs = sortedDeeds.map((deed) =>
          limit(async () => {
            try {
              await throttleRate(MIN_INTERVAL_MS);
              const stakedAssets = await getCachedStakedAssets(deed.deed_uid);
              const enriched = {
                ...deed,
                stakedAssets,
              };

              index++;
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    type: "deed",
                    index,
                    total: sortedDeeds.length,
                    deed: enriched,
                  }) + "\n"
                )
              );
            } catch (err) {
              logError(`Error enriching deed ${deed.deed_uid}`, err);
            }
          })
        );

        // Wait for all jobs to finish
        await Promise.all(jobs);
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain" },
    });
  } catch (err) {
    logError("Failed to stream enriched deeds", err);
    return new Response("Internal error", { status: 500 });
  }
}

async function throttleRate(minIntervalMs: number) {
  const now = Date.now();
  const waitTime = Math.max(0, nextAvailableTime - now);
  nextAvailableTime = Math.max(now, nextAvailableTime) + minIntervalMs;
  if (waitTime > 0) {
    await new Promise((res) => setTimeout(res, waitTime));
  }
}
