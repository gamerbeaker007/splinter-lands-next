import {
  getLastWorkerRuns,
  markStaleWorkerRunsFailed,
} from "@/lib/backend/api/internal/worker-run-data";
import logger, { logError } from "@/lib/backend/log/logger.server";
import {
  runDailyJob,
  runJobWithTracking,
  runWeeklyJob,
} from "@/lib/backend/services/dataJobs";
import "dotenv/config"; // MUST be first — loads .env before any module reads process.env
import {
  interruptibleSleep,
  registerShutdownHandlers,
  shouldShutdown,
} from "./lib/graceful-shutdown";

registerShutdownHandlers();

/**
 * Returns the most recent scheduled daily slot (today at 01:00 UTC if that
 * time has already passed, otherwise yesterday at 01:00 UTC).
 */
function lastDailySlot(): Date {
  const slot = new Date();
  slot.setUTCHours(1, 0, 0, 0);
  if (slot.getTime() > Date.now()) {
    slot.setUTCDate(slot.getUTCDate() - 1);
  }
  return slot;
}

/**
 * Returns the most recent scheduled weekly slot (most recent Sunday at
 * 02:00 UTC, including today if today is Sunday and that time has passed).
 */
function lastWeeklySlot(): Date {
  const slot = new Date();
  slot.setUTCHours(2, 0, 0, 0);
  const daysSinceSunday = slot.getUTCDay(); // 0 = Sunday
  slot.setUTCDate(slot.getUTCDate() - daysSinceSunday);
  if (slot.getTime() > Date.now()) {
    slot.setUTCDate(slot.getUTCDate() - 7);
  }
  return slot;
}

/** Returns milliseconds until the next 01:00 UTC. */
function msUntilNextDailyRun(): number {
  const next = new Date();
  next.setUTCHours(1, 0, 0, 0);
  if (next.getTime() <= Date.now()) {
    next.setUTCDate(next.getUTCDate() + 1);
  }
  return next.getTime() - Date.now();
}

/** Returns milliseconds until the next Sunday at 02:00 UTC. */
function msUntilNextWeeklyRun(): number {
  const next = new Date();
  next.setUTCHours(2, 0, 0, 0);
  const daysUntilSunday = next.getUTCDay() === 0 ? 0 : 7 - next.getUTCDay();
  next.setUTCDate(next.getUTCDate() + daysUntilSunday);
  if (next.getTime() <= Date.now()) {
    next.setUTCDate(next.getUTCDate() + 7);
  }
  return next.getTime() - Date.now();
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

async function runCatchUp(): Promise<void> {
  const { daily: lastDaily, weekly: lastWeekly } = await getLastWorkerRuns();

  const lastDailyCompleted =
    lastDaily?.status === "completed" ? lastDaily.started_at : null;
  if (!lastDailyCompleted || lastDailyCompleted < lastDailySlot()) {
    logger.info("Worker: missed daily slot detected — running daily job now");
    await runJobWithTracking("daily", runDailyJob);
  }

  if (shouldShutdown()) return;

  const lastWeeklyCompleted =
    lastWeekly?.status === "completed" ? lastWeekly.started_at : null;
  if (!lastWeeklyCompleted || lastWeeklyCompleted < lastWeeklySlot()) {
    logger.info("Worker: missed weekly slot detected — running weekly job now");
    await runJobWithTracking("weekly", runWeeklyJob);
  }
}

async function main(): Promise<void> {
  logger.info("Worker: starting background worker");

  const { count: stale } = await markStaleWorkerRunsFailed();
  if (stale > 0) {
    logger.warn(`Worker: marked ${stale} stale worker run(s) as failed`);
  }

  await runCatchUp();

  if (shouldShutdown()) {
    logger.info("Worker: shut down during catch-up");
    process.exit(0);
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
