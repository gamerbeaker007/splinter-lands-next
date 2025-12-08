import "dotenv/config";
import logger from "@/lib/backend/log/logger.server";
import { logError } from "@/lib/backend/log/logUtils";
import { prisma } from "@/lib/prisma";
import { computeAndStoreDailyActiveMetrics } from "@/scripts/lib/metrics/active";
import { computeAndStoreResourceHubMetrics } from "@/scripts/lib/metrics/resourceHub";
import { computeAndStorePlayerProduction } from "@/scripts/lib/metrics/resourcePlayerProduction";
import { computeAndStoreResourceProduction } from "@/scripts/lib/metrics/resourceProduction";
import { computeAndStoreTotalSupply } from "@/scripts/lib/metrics/resourceSupply";
import { fetchAndProcessRegionData } from "@/scripts/lib/region/region";
import { getTodayAtMidnight } from "@/scripts/lib/utils/date";
import { computeAndStoreBurnedResources } from "./lib/metrics/resourceBurnedDaily";

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
  await computeAndStoreBurnedResources(today);
  await pushLastUpdateDate();

  logger.info(
    `--------- ✅ Finished data inject. Total time: ${(Date.now() - start) / 1000}s ---------`
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
