import { computeAndStoreResourceHubMetrics } from "@/scripts/lib/metrics/resourceHub";
import { computeAndStoreDailyActiveMetrics } from "@/scripts/lib/metrics/active";
import { fetchAndProcessRegionData } from "@/scripts/lib/region/region";
import { computeAndStoreTotalSupply } from "@/scripts/lib/metrics/resourceSupply";
import { computeAndStoreResourceProduction } from "@/scripts/lib/metrics/resourceProduction";
import { getTodayAtMidnight } from "@/scripts/lib/utils/date";
import { computeAndStorePlayerProduction } from "@/scripts/lib/metrics/resourcePlayerProduction";
import { prisma } from "@/lib/prisma";
import dotenv from "dotenv";
import { logger } from "@/lib/backend/log/logger";
import { logError } from "@/lib/backend/log/logUtils";

dotenv.config();

async function main() {
  logger.info("🚀 Starting daily data inject script...");
  const start = Date.now();

  const today = getTodayAtMidnight();

  await fetchAndProcessRegionData();
  await computeAndStoreDailyActiveMetrics(today);
  await computeAndStoreResourceHubMetrics(today);
  await computeAndStoreTotalSupply(today);
  await computeAndStoreResourceProduction(today);
  await computeAndStorePlayerProduction(today);
  await pushLastUpdateDate();

  logger.info(
    `--------- ✅ Finished data inject. Total time: ${(Date.now() - start) / 1000}s ---------`,
  );
}

async function pushLastUpdateDate() {
  await prisma.lastUpdate.upsert({
    where: { id: 1 },
    update: { updatedAt: new Date() },
    create: { id: 1, updatedAt: new Date() },
  });
  logger.info("✅ Last update timestamp set.");
}

main().catch((err) => {
  logError("ERROR Data Inject", err);
  process.exit(1);
});
