import { logError } from "@/lib/backend/log/logUtils";
import { getCachedStakedAssets } from "@/lib/backend/services/playerService";
import { DeedComplete } from "@/types/deed";
import pLimit from "p-limit";

export async function POST(req: Request) {
  const { deeds, force } = await req.json();
  const limit = pLimit(10); // limit concurrency to 5

  // Create an array of jobs with concurrency
  const jobs = deeds.map((deed: DeedComplete, i: number) =>
    limit(async () => {
      try {
        const stakedAssets = await getCachedStakedAssets(deed.deed_uid, force);
        const enriched = { ...deed, stakedAssets };
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
