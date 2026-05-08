"use server";

import { listLogs, type LogLevel } from "@/lib/backend/api/internal/log-data";
import {
  getLastWorkerRuns,
  type WorkerJobType,
} from "@/lib/backend/api/internal/worker-run-data";
import { authOptions } from "@/lib/backend/auth/authOptions";
import { cache, dailyCache } from "@/lib/backend/cache/cache";
import {
  runDailyJob,
  runJobWithTracking,
  runWeeklyJob,
} from "@/lib/backend/services/dataJobs";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath, unstable_noStore } from "next/cache";

export async function getMemoryUsage() {
  unstable_noStore();
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  return {
    heapUsed: process.memoryUsage().heapUsed,
    heapTotal: process.memoryUsage().heapTotal,
    rss: process.memoryUsage().rss,
    external: process.memoryUsage().external,
  };
}

export async function getCacheStatus() {
  unstable_noStore();
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  const keys = cache.keys();
  const dailyKeys = dailyCache.keys();

  const users: string[] = [];
  for (const key of keys) {
    if (key.startsWith("region-data:")) {
      const user = key.split(":").at(-1);
      if (user) users.push(user);
    }
  }

  return {
    cacheKeys: keys.length,
    users: users,
    dailyCacheKeys: dailyKeys.length,
  };
}

export async function clearCache() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  cache.flushAll();
  dailyCache.flushAll();

  revalidatePath("/admin");
  return { success: true, message: "Cache cleared" };
}

export async function getLogsAction(
  page = 1,
  level?: LogLevel,
  limit = 50,
  search?: string
) {
  unstable_noStore();
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  const safeLimit = Math.min(Math.max(1, limit), 1000);
  const safeSearch = search?.trim().slice(0, 200) || undefined;
  const { logs, total } = await listLogs({
    page,
    limit: safeLimit,
    level,
    search: safeSearch,
  });

  return {
    logs: logs.map((l) => ({
      ...l,
      created_at: l.created_at.toISOString(),
    })),
    total,
    pages: Math.ceil(total / safeLimit),
  };
}

export async function getWorkerRunStatus() {
  unstable_noStore();
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  return getLastWorkerRuns();
}

export async function triggerJobAction(
  jobType: WorkerJobType
): Promise<{ started: boolean; reason?: string }> {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  // Guard: don't start a second run if one is already active
  const activeRun = await prisma.workerRun.findFirst({
    where: { job_type: jobType, status: "running" },
  });
  if (activeRun) {
    return { started: false, reason: "A run is already in progress" };
  }

  const jobFn = jobType === "daily" ? runDailyJob : runWeeklyJob;

  // Fire-and-forget: the job runs in the background;
  // the caller gets an immediate response and can poll getWorkerRunStatus().
  setImmediate(() => {
    runJobWithTracking(jobType, jobFn).catch(console.error);
  });

  return { started: true };
}
