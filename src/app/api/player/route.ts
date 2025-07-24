import { getPlayerData } from "@/lib/backend/api/internal/player-data";
import { logError } from "@/lib/backend/log/logUtils";
import { getCachedStakedAssets } from "@/lib/backend/services/playerService";
import { enrichWithProgressInfo } from "@/lib/backend/services/regionService";
import { sortDeeds } from "@/lib/filters";
import { DeedComplete } from "@/types/deed";
import pLimit from "p-limit";

const DEED_LIMIT = 200;

export async function POST(req: Request) {
  try {
    const { filters, player } = await req.json();
    const deeds: DeedComplete[] = await getPlayerData(player, filters);
    if (!deeds) return new Response("No deeds found", { status: 404 });

    const enrichedDeeds = enrichWithProgressInfo(deeds);
    const sorted = sortDeeds(enrichedDeeds, filters.sorting);

    const warning =
      sorted.length > DEED_LIMIT
        ? `Showing only ${DEED_LIMIT} of ${sorted.length} deeds due to performance limits.`
        : null;

    const deedsToEnrich = sorted.slice(0, DEED_LIMIT);

    const limit = pLimit(10);
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        if (warning) {
          controller.enqueue(
            encoder.encode(JSON.stringify({ type: "warning", warning }) + "\n"),
          );
        }

        let index = 0;

        // Wrap jobs with concurrency
        const jobs = deedsToEnrich.map((deed) =>
          limit(async () => {
            try {
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
                    total: deedsToEnrich.length,
                    deed: enriched,
                  }) + "\n",
                ),
              );
            } catch (err) {
              logError(`Error enriching deed ${deed.deed_uid}`, err);
            }
          }),
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
