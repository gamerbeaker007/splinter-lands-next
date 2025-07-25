import { getAllTradeHubData } from "@/lib/backend/api/internal/trade-hub-data";
import { logError } from "@/lib/backend/log/logUtils";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const data = await getAllTradeHubData();
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    logError("Failed to load data", err);
    return NextResponse.json({ error: "Failed to load data" }, { status: 501 });
  }
}
