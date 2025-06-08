import { getAllActiveData } from "@/lib/api/internal/active-data";
import { NextResponse } from "next/server";
import { toActiveDtoList } from "@/lib/mappers/active-mapper";

export async function GET() {
  try {
    const data = await getAllActiveData();
    const dto = toActiveDtoList(data);
    return NextResponse.json(dto, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load data" }, { status: 501 });
  }
}
