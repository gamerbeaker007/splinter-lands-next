import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type LogLevel = "info" | "warn" | "error";

export async function createLog(
  level: LogLevel,
  message: string,
  meta?: Record<string, unknown>
) {
  return prisma.log.create({
    data: {
      level,
      message,
      meta: meta ? (meta as Prisma.InputJsonValue) : Prisma.JsonNull,
    },
  });
}

export async function listLogs(opts: {
  page: number;
  limit: number;
  level?: LogLevel;
  search?: string;
}) {
  const { page, limit, level, search } = opts;
  const where: Prisma.LogWhereInput = {
    ...(level ? { level } : {}),
    ...(search ? { message: { contains: search, mode: "insensitive" } } : {}),
  };
  const [logs, total] = await Promise.all([
    prisma.log.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.log.count({ where }),
  ]);
  return { logs, total };
}

export async function pruneLogs(olderThanDays: number) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - olderThanDays);
  return prisma.log.deleteMany({ where: { created_at: { lt: cutoff } } });
}
