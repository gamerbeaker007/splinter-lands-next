import { logError } from "@/lib/backend/log/logUtils";
import { getCachedCardDetailsData } from "@/lib/backend/services/cardService";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await getCachedCardDetailsData();

    if (!result)
      return NextResponse.json({ error: "No data found" }, { status: 404 });

    return NextResponse.json(result);
  } catch (err) {
    logError("Failed to load worksite data", err);
    return NextResponse.json(
      { error: "Failed to load worksite data" },
      { status: 501 },
    );
  }
}
