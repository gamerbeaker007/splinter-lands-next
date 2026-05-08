/**
 * Shared job implementations for the daily and weekly data pipelines.
 * Imported by both the worker process and admin Server Actions (manual trigger).
 */

import { pruneLogs } from "@/lib/backend/api/internal/log-data";
import {
  completeWorkerRun,
  createWorkerRun,
  pruneWorkerRuns,
  type WorkerJobType,
} from "@/lib/backend/api/internal/worker-run-data";
import logger from "@/lib/backend/log/logger.server";
import { prisma } from "@/lib/prisma";
import { refreshNextCache } from "@/scripts/lib/cache/refreshCache";
import { computeAndStoreDailyActiveMetrics } from "@/scripts/lib/metrics/active";
import { computeAndStorePlayerCardCollections } from "@/scripts/lib/metrics/playerCardCollection";
import { computeAndStorePlayerHubPosition } from "@/scripts/lib/metrics/playerTradeHubPosition";
import { computeAndStoreBurnedResources } from "@/scripts/lib/metrics/resourceBurnedDaily";
import { computeAndStoreResourceHubMetrics } from "@/scripts/lib/metrics/resourceHub";
import { computeAndStorePlayerProduction } from "@/scripts/lib/metrics/resourcePlayerProduction";
import { computeAndStoreResourceProduction } from "@/scripts/lib/metrics/resourceProduction";
import { computeAndStoreTotalSupply } from "@/scripts/lib/metrics/resourceSupply";
import { fetchAndProcessRegionData } from "@/scripts/lib/region/region";
import { getTodayAtMidnight } from "@/scripts/lib/utils/date";

const LOG_RETENTION_DAYS = 5;

export async function runDailyJob(): Promise<void> {
  logger.info("Job: running daily job");
  const today = getTodayAtMidnight();

  await fetchAndProcessRegionData();
  await computeAndStoreDailyActiveMetrics(today);
  await computeAndStoreResourceHubMetrics(today);
  await computeAndStoreTotalSupply(today);
  await computeAndStoreResourceProduction(today);
  await computeAndStorePlayerProduction(today);
  await computeAndStoreBurnedResources(today);

  await prisma.lastUpdate.upsert({
    where: { id: 1 },
    update: { updatedAt: new Date() },
    create: { id: 1, updatedAt: new Date() },
  });

  try {
    await refreshNextCache();
  } catch (error) {
    logger.warn(
      "Job: failed to refresh Next.js cache - continuing anyway",
      error
    );
  }

  // Prune logs older than LOG_RETENTION_DAYS
  try {
    const { count } = await pruneLogs(LOG_RETENTION_DAYS);
    if (count > 0)
      logger.info(
        `Job: pruned ${count} log entries older than ${LOG_RETENTION_DAYS} days`
      );
  } catch (error) {
    logger.warn("Job: log pruning failed", {
      message: error instanceof Error ? error.message : String(error),
    });
  }

  // Prune worker run records older than 30 days
  try {
    const { count } = await pruneWorkerRuns();
    if (count > 0)
      logger.info(
        `Job: pruned ${count} worker run record(s) older than 30 days`
      );
  } catch (error) {
    logger.warn("Job: worker run pruning failed", {
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function runWeeklyJob(): Promise<void> {
  logger.info("Job: running weekly job");
  const today = getTodayAtMidnight();

  await computeAndStorePlayerHubPosition(today);
  await computeAndStorePlayerCardCollections(today);

  try {
    await refreshNextCache();
  } catch (error) {
    logger.warn(
      "Job: failed to refresh Next.js cache - continuing anyway",
      error
    );
  }
}

export async function runJobWithTracking(
  jobType: WorkerJobType,
  jobFn: () => Promise<void>
): Promise<void> {
  const run = await createWorkerRun(jobType);
  logger.info(`Job: started ${jobType} run (id=${run.id})`);

  try {
    await jobFn();
    await completeWorkerRun(run.id, "completed");
    logger.info(`Job: ${jobType} run completed successfully (id=${run.id})`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    await completeWorkerRun(run.id, "failed", msg);
    logger.error(`Job: ${jobType} run failed (id=${run.id}): ${msg}`);
  }
}
