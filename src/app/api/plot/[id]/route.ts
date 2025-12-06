import { NextResponse } from "next/server";
import { logError } from "@/lib/backend/log/logUtils";
import {
  fetchDeedUid,
  fetchStakedAssets,
} from "@/lib/backend/api/spl/spl-land-api";
import type { DeedComplete } from "@/types/deed";
import { NotFoundError } from "@/lib/backend/error";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const num = Number(id);
  if (!Number.isFinite(num)) {
    return NextResponse.json(
      { error: "Invalid 'id' parameter", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }

  try {
    const deed = (await fetchDeedUid(num)) as DeedComplete | null;

    if (!deed) {
      // Or have fetchDeedUid throw NotFoundError
      return NextResponse.json(
        { error: `Plot ${num} not found`, code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const stakedAssets = await fetchStakedAssets(deed.deed_uid);
    deed.stakedAssets = stakedAssets;

    return NextResponse.json(deed, { status: 200 });
  } catch (err: unknown) {
    // Map known error types to better status codes
    if (err instanceof NotFoundError) {
      return NextResponse.json(
        { error: `Plot ${num} not found`, code: "NOT_FOUND" },
        { status: 404 }
      );
    }
    logError("Unhandled error in GET /api/plot/[id]", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
