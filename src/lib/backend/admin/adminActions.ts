"use server";

import { authOptions } from "@/lib/backend/auth/authOptions";
import { cache, dailyCache } from "@/lib/backend/cache/cache";
import { logError } from "@/lib/backend/log/logUtils";
import fs from "fs/promises";
import { getServerSession } from "next-auth";
import { revalidatePath, unstable_noStore } from "next/cache";
import path from "path";

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

export async function getApplicationLogs() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  const filePath = path.resolve("logs/app.log");

  try {
    const contents = await fs.readFile(filePath, "utf8");
    return { logs: contents };
  } catch (error) {
    logError("Failed to read log file", error);
    throw new Error("Could not read log file");
  }
}
