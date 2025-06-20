import { getAllActiveData } from "@/lib/backend/api/internal/active-data";
import { NextResponse } from "next/server";
import { toActiveDtoList } from "@/lib/backend/mappers/active-mapper";
import { logError } from "@/lib/backend/log/logUtils";

export async function GET() {
  try {
    const data = await getAllActiveData();
    const dto = toActiveDtoList(data);
    return NextResponse.json(dto, { status: 200 });
  } catch (err) {
    logError("Failed to load data", err);
    return NextResponse.json({ error: "Failed to load data" }, { status: 501 });
  }
}
