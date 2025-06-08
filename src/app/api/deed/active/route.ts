import { getActiveDeedCountByRegion } from "@/lib/api/internal/deed-data";
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
    console.error(err);
    return NextResponse.json(
      { error: "Failed to load worksite data" },
      { status: 501 },
    );
  }
}
