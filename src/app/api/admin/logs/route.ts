import { authOptions } from "@/lib/backend/auth/authOptions";
import { logError } from "@/lib/backend/log/logUtils";
import fs from "fs/promises";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import path from "path";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const filePath = path.resolve("logs/app.log");

  try {
    const contents = await fs.readFile(filePath, "utf8");
    return NextResponse.json({ logs: contents });
  } catch (error) {
    logError("Failed to read log file", error);
    return NextResponse.json(
      { error: "Could not read log file" },
      { status: 500 },
    );
  }
}
