import { logError } from "@/lib/backend/log/logUtils";
import { getActiveDeedCountByRegion } from "@/lib/backend/services/regionService";
import { FilterInput } from "@/types/filters";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const filters: FilterInput = await req.json();
    const result = await getActiveDeedCountByRegion(filters);

    if (!result)
      return NextResponse.json({ error: "No data found" }, { status: 404 });

    return NextResponse.json(result);
  } catch (err) {
    logError("Failed to load active data", err);
    return NextResponse.json(
      { error: "Failed to load active data" },
      { status: 501 },
    );
  }
}
