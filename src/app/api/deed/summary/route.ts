import { logError } from "@/lib/backend/log/logUtils";
import { getRegionSummary } from "@/lib/backend/services/regionService";
import { FilterInput } from "@/types/filters";
import { RegionSummary } from "@/types/regionSummary";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const filters: FilterInput = await req.json();
    const result: RegionSummary = await getRegionSummary(filters);

    if (!result)
      return NextResponse.json({ error: "No data found" }, { status: 404 });

    return NextResponse.json(result);
  } catch (err) {
    logError("Failed to load summary data", err);
    return NextResponse.json(
      { error: "Failed to load summary data" },
      { status: 501 },
    );
  }
}
