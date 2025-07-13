import { getProgressInfo } from "@/lib/backend/helpers/productionUtils";
import { logError } from "@/lib/backend/log/logUtils";
import { getCachedStakedAssets } from "@/lib/backend/services/playerService";
import { DeedComplete } from "@/types/deed";
import { ProgressInfo } from "@/types/progressInfo";
import pLimit from "p-limit";

export async function POST(req: Request) {
  const { deeds, force } = await req.json();
  const limit = pLimit(10); // limit concurrency to 5

  // Create an array of jobs with concurrency
  const jobs = deeds.map((deed: DeedComplete, i: number) =>
    limit(async () => {
      try {
        const stakedAssets = await getCachedStakedAssets(deed.deed_uid, force);

        const progressInfo: ProgressInfo =
          deed.worksiteDetail?.token_symbol != "TAX"
            ? getProgressInfo(
                deed.worksiteDetail?.hours_since_last_op ?? 0,
                deed.worksiteDetail?.project_created_date ?? null,
                deed.worksiteDetail?.projected_end ?? null,
                deed.stakingDetail?.total_harvest_pp ?? 0,
              )
            : {
                percentageDone: 0,
                infoStr: `N/A`,
                progressTooltip:
                  "The status of Keeps and Castles remains a mystery for now.",
              };

        const enriched = { ...deed, stakedAssets, progressInfo };
        return { index: i + 1, total: deeds.length, deed: enriched };
      } catch (err) {
        logError(`Error with deed ${deed.deed_uid}`, err);
        return {
          index: i + 1,
          total: deeds.length,
          deed: { ...deed, stakedAssets: null },
        };
      }
    }),
  );

  const stream = new ReadableStream({
    async start(controller) {
      for await (const result of jobs) {
        const chunk = JSON.stringify(result);
        controller.enqueue(new TextEncoder().encode(chunk + "\n"));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain" },
  });
}
