import { getCachedPlayerDetails } from "@/lib/backend/services/playerService";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const player = searchParams.get("player");

  if (!player) {
    return NextResponse.json(
      { error: "Missing 'player' parameter" },
      { status: 400 }
    );
  }

  try {
    const data = await getCachedPlayerDetails(player);
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    const isNotFound = message.toLowerCase().includes("not found");
    return NextResponse.json(
      { error: message },
      { status: isNotFound ? 404 : 501 }
    );
  }
}
