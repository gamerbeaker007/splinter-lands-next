import { NextResponse } from "next/server";
import { getPlayerData } from "@/lib/api/internal/player-data";
import { DeedComplete } from "@/types/deed";

export async function POST(req: Request) {
  try {
    const { filters, player } = await req.json();
    const result: DeedComplete[] = await getPlayerData(player, filters);

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
