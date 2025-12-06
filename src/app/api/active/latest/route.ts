import { getLatestActiveEntry } from "@/lib/backend/api/internal/active-data";
import { logError } from "@/lib/backend/log/logUtils";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const latest = await getLatestActiveEntry();
    if (!latest)
      return NextResponse.json({ error: "No data found" }, { status: 404 });

    return NextResponse.json(latest);
  } catch (err) {
    logError("Failed to load latest data", err);
    return NextResponse.json(
      { error: "Failed to load latest data" },
      { status: 501 }
    );
  }
}
