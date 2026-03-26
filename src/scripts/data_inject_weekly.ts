import logger from "@/lib/backend/log/logger.server";
import { logError } from "@/lib/backend/log/logUtils";
import { getTodayAtMidnight } from "@/scripts/lib/utils/date";
import "dotenv/config";
import { refreshNextCache } from "./lib/cache/refreshCache";
import { computeAndStorePlayerCardCollections } from "./lib/metrics/playerCardCollection";
import { computeAndStorePlayerHubPosition } from "./lib/metrics/playerTradeHubPosition";

async function main() {
  logger.info("🚀 Starting weekly data inject script...");
  const start = Date.now();

  const today = getTodayAtMidnight();

  await computeAndStorePlayerHubPosition(today);
  await computeAndStorePlayerCardCollections(today);

  // Refresh Next.js cache after data injection
  try {
    await refreshNextCache();
  } catch (error) {
    logger.warn(
      "⚠️  Failed to refresh Next.js cache - continuing anyway ...",
      error
    );
  }

  logger.info(
    `--------- ✅ Finished data inject. Total time: ${(Date.now() - start) / 1000}s ---------`
  );
}

main().catch((err) => {
  logError("ERROR Data Inject", err);
  process.exit(1);
});
