import { prisma } from "@/lib/prisma";

export type WorkerJobType = "daily" | "weekly";
export type WorkerRunStatus = "running" | "completed" | "failed";

export async function createWorkerRun(jobType: WorkerJobType) {
  return prisma.workerRun.create({
    data: { job_type: jobType, status: "running" },
  });
}

export async function completeWorkerRun(
  id: string,
  status: Exclude<WorkerRunStatus, "running">,
  error?: string
) {
  const now = new Date();
  const run = await prisma.workerRun.findUnique({ where: { id } });
  const duration_ms = run ? now.getTime() - run.started_at.getTime() : null;

  return prisma.workerRun.update({
    where: { id },
    data: {
      status,
      finished_at: now,
      duration_ms,
      ...(error !== undefined ? { error } : {}),
    },
  });
}

export async function markStaleWorkerRunsFailed() {
  return prisma.workerRun.updateMany({
    where: { status: "running" },
    data: {
      status: "failed",
      finished_at: new Date(),
      error: "Stale: worker restarted",
    },
  });
}

const WORKER_RUN_RETENTION_DAYS = 30;

export async function pruneWorkerRuns() {
  const cutoff = new Date(
    Date.now() - WORKER_RUN_RETENTION_DAYS * 24 * 60 * 60 * 1000
  );
  return prisma.workerRun.deleteMany({
    where: { started_at: { lt: cutoff } },
  });
}

export async function getLastWorkerRuns() {
  const [daily, weekly] = await Promise.all([
    prisma.workerRun.findFirst({
      where: { job_type: "daily" },
      orderBy: { started_at: "desc" },
    }),
    prisma.workerRun.findFirst({
      where: { job_type: "weekly" },
      orderBy: { started_at: "desc" },
    }),
  ]);
  return { daily, weekly };
}
