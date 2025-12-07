import { getCachedSplPriceData } from "@/lib/backend/services/tokenService";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { force } = await req.json();
    const splPriceData = await getCachedSplPriceData(force);

    return NextResponse.json(splPriceData, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    const isNotFound = message.toLowerCase().includes("not found");
    return NextResponse.json(
      { error: message },
      { status: isNotFound ? 404 : 501 }
    );
  }
}
