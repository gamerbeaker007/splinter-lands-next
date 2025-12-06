import { getCachedCardDetailsData } from "@/lib/backend/services/cardService";
import { getCachedMarketData } from "@/lib/backend/services/marketService";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { force } = await req.json();
    const cardDetails = await getCachedCardDetailsData(force);
    const lowestMarketData = await getCachedMarketData(cardDetails, force);

    return NextResponse.json(lowestMarketData, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    const isNotFound = message.toLowerCase().includes("not found");
    return NextResponse.json(
      { error: message },
      { status: isNotFound ? 404 : 501 }
    );
  }
}
