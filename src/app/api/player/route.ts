import { getPlayerData } from "@/lib/backend/api/internal/player-data";
import { getProgressInfo } from "@/lib/backend/helpers/productionUtils";
import { logError } from "@/lib/backend/log/logUtils";
import { getCachedStakedAssets } from "@/lib/backend/services/playerService";
import { sortDeeds } from "@/lib/filters";
import { DeedComplete } from "@/types/deed";
import { ProgressInfo } from "@/types/progressInfo";
import pLimit from "p-limit";

const DEED_LIMIT = 200;

export async function POST(req: Request) {
  try {
    const { filters, player, force } = await req.json();
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
              const stakedAssets = await getCachedStakedAssets(
                deed.deed_uid,
                force,
              );
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

function enrichWithProgressInfo(deeds: DeedComplete[]): DeedComplete[] {
  return deeds.map((deed) => {
    const isTaxSymbol = deed.worksiteDetail?.token_symbol === "TAX";
    const progressInfo: ProgressInfo = isTaxSymbol
      ? {
          percentageDone: 0,
          infoStr: "N/A",
          progressTooltip:
            "The status of Keeps and Castles remains a mystery for now.",
        }
      : getProgressInfo(
          deed.worksiteDetail?.hours_since_last_op ?? 0,
          deed.worksiteDetail?.project_created_date ?? null,
          deed.worksiteDetail?.projected_end ?? null,
          deed.stakingDetail?.total_harvest_pp ?? 0,
        );

    return {
      ...deed,
      progressInfo,
    };
  });
}
