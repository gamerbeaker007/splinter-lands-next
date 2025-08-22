import { NextResponse } from "next/server";
import { logError } from "@/lib/backend/log/logUtils";
import {
  fetchDeedUid as fetchDeedDetails,
  fetchStakedAssets,
} from "@/lib/backend/api/spl/spl-land-api";
import { DeedComplete } from "@/types/deed";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const num = Number(id);
  if (!Number.isFinite(num)) {
    return NextResponse.json(
      { error: "Invalid 'id' parameter" },
      { status: 400 },
    );
  }
  try {
    const deed = (await fetchDeedDetails(num)) as DeedComplete;
    const stakesAssets = await fetchStakedAssets(deed.deed_uid);
    deed.stakedAssets = stakesAssets;
    return NextResponse.json(deed, { status: 200 });
  } catch (err) {
    logError("Failed to stream enriched deeds", err);
    return new Response("Internal error", { status: 500 });
  }
}
