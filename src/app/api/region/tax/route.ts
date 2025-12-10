import { getRegionTax } from "@/lib/backend/actions/region/tax-actions";
import { logError } from "@/lib/backend/log/logUtils";
import { FilterInput } from "@/types/filters";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const filters: FilterInput = await req.json();
    const result = await getRegionTax(filters);
    return NextResponse.json(result);
  } catch (err) {
    logError("Failed to load active data", err);
    return NextResponse.json(
      { error: "Failed to load active data" },
      { status: 501 }
    );
  }
}
