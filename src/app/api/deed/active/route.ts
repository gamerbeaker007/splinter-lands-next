import { getActiveDeedCountByRegion } from "@/lib/api/internal/deed-data";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const latest = await getActiveDeedCountByRegion();
    if (!latest)
      return NextResponse.json({ error: "No data found" }, { status: 404 });

    return NextResponse.json(latest);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to load worksite data" },
      { status: 501 },
    );
  }
}
