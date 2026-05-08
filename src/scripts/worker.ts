import { markStaleWorkerRunsFailed } from "@/lib/backend/api/internal/worker-run-data";
import logger, { logError } from "@/lib/backend/log/logger.server";
import {
  runDailyJob,
  runJobWithTracking,
  runWeeklyJob,
} from "@/lib/backend/services/dataJobs";
import "dotenv/config";
import {
  interruptibleSleep,
  registerShutdownHandlers,
  shouldShutdown,
} from "./lib/graceful-shutdown";

registerShutdownHandlers();

/** Returns milliseconds until the next 01:00 AM (local time). */
function msUntilNextDailyRun(): number {
  const now = new Date();
  const next = new Date(now);
  next.setHours(1, 0, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next.getTime() - now.getTime();
}

/** Returns milliseconds until the next Sunday at 02:00 AM (local time). */
function msUntilNextWeeklyRun(): number {
  const now = new Date();
  const next = new Date(now);
  next.setHours(2, 0, 0, 0);
  // Days until next Sunday (0 = Sunday)
  const daysUntilSunday = next.getDay() === 0 ? 0 : 7 - next.getDay();
  next.setDate(next.getDate() + daysUntilSunday);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 7);
  }
  return next.getTime() - now.getTime();
}

async function dailyLoop(): Promise<void> {
  while (!shouldShutdown()) {
    const ms = msUntilNextDailyRun();
    logger.info(
      `Worker: next daily run in ${Math.round(ms / 1000 / 60)} minutes`
    );
    await interruptibleSleep(ms);
    if (shouldShutdown()) break;
    await runJobWithTracking("daily", runDailyJob);
  }
}

async function weeklyLoop(): Promise<void> {
  while (!shouldShutdown()) {
    const ms = msUntilNextWeeklyRun();
    logger.info(
      `Worker: next weekly run in ${Math.round(ms / 1000 / 60)} minutes`
    );
    await interruptibleSleep(ms);
    if (shouldShutdown()) break;
    await runJobWithTracking("weekly", runWeeklyJob);
  }
}

async function main(): Promise<void> {
  logger.info("Worker: starting background worker");

  const { count: stale } = await markStaleWorkerRunsFailed();
  if (stale > 0) {
    logger.warn(`Worker: marked ${stale} stale worker run(s) as failed`);
  }

  logger.info("Worker: daily loop and weekly loop starting");
  await Promise.all([dailyLoop(), weeklyLoop()]);

  logger.info("Worker: shut down cleanly");
  process.exit(0);
}

main().catch((err) => {
  logError("Worker: fatal error", err);
  process.exit(1);
});
