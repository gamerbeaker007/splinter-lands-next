import { NextResponse } from "next/server";
import { FilterInput } from "@/types/filters";
import { getRegionSummary } from "@/lib/api/internal/deed-data";
import { RegionSummary } from "@/types/regionSummary";

export async function POST(req: Request) {
  try {
    const filters: FilterInput = await req.json();
    const result: RegionSummary = await getRegionSummary(filters);

    if (!result)
      return NextResponse.json({ error: "No data found" }, { status: 404 });

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to load worksite data" },
      { status: 501 },
    );
  }
}
