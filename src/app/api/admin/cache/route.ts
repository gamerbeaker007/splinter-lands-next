import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/backend/auth/authOptions";
import { cache, dailyCache } from "@/lib/backend/cache/cache";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const keys = cache.keys();
  const dailyKeys = dailyCache.keys();

  const users = [];
  for (const key of keys) {
    if (key.startsWith("region-data:")) {
      users.push(key.split(":").at(-1));
    }
  }

  return NextResponse.json({
    cacheKeys: keys.length,
    users: users,
    dailyCacheKeys: dailyKeys.length,
  });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  cache.flushAll();
  dailyCache.flushAll();

  return NextResponse.json({ success: true, message: "Cache cleared" });
}
