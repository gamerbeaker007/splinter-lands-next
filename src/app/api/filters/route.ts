import { NextResponse } from "next/server";
import { getAvailableFilterValues } from "@/lib/api/internal/deed-data";

export async function GET() {
  try {
    const result = await getAvailableFilterValues();

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
