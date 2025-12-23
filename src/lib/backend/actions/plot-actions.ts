"use server";

import {
  fetchDeedUid,
  fetchStakedAssets,
} from "@/lib/backend/api/spl/spl-land-api";
import { NotFoundError } from "@/lib/backend/error";
import type { DeedComplete } from "@/types/deed";

/**
 * Get plot detail by ID.
 */
export async function getPlotById(id: number): Promise<DeedComplete> {
  if (!Number.isFinite(id)) {
    throw new Error("Invalid 'id' parameter");
  }

  const deed = (await fetchDeedUid(id)) as DeedComplete | null;

  if (!deed) {
    throw new NotFoundError(`Plot ${id} not found`);
  }

  const stakedAssets = await fetchStakedAssets(deed.deed_uid);
  deed.stakedAssets = stakedAssets;

  return deed;
}
