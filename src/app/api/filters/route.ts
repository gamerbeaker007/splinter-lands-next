import { logError } from "@/lib/backend/log/logUtils";
import { getAvailableFilterValues } from "@/lib/backend/services/regionService";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const player = searchParams.get("player") || null;
    const result = await getAvailableFilterValues(player);

    if (!result)
      return NextResponse.json({ error: "No data found" }, { status: 404 });

    return NextResponse.json(result);
  } catch (err) {
    logError("Failed to load filter data", err);
    return NextResponse.json(
      { error: "Failed to load filter data" },
      { status: 501 }
    );
  }
}
