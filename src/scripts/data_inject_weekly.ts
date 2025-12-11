import "dotenv/config";
import logger from "@/lib/backend/log/logger.server";
import { logError } from "@/lib/backend/log/logUtils";
import { getTodayAtMidnight } from "@/scripts/lib/utils/date";
import { computeAndStorePlayerHubPosition } from "./lib/metrics/playerTradeHubPosition";
import { refreshNextCache } from "./lib/cache/refreshCache";

async function main() {
  logger.info("🚀 Starting weekly data inject script...");
  const start = Date.now();

  const today = getTodayAtMidnight();

  await computeAndStorePlayerHubPosition(today);

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
