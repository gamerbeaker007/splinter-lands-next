import logger from "@/lib/backend/log/logger.server";
import { logError } from "@/lib/backend/log/logUtils";
import { getTodayAtMidnight } from "@/scripts/lib/utils/date";
import dotenv from "dotenv";
import { computeAndStorePlayerHubPosition } from "./lib/metrics/playerTradeHubPosition";

dotenv.config();

async function main() {
  logger.info("🚀 Starting weekly data inject script...");
  const start = Date.now();

  const today = getTodayAtMidnight();

  await computeAndStorePlayerHubPosition(today);

  logger.info(
    `--------- ✅ Finished data inject. Total time: ${(Date.now() - start) / 1000}s ---------`
  );
}

main().catch((err) => {
  logError("ERROR Data Inject", err);
  process.exit(1);
});
