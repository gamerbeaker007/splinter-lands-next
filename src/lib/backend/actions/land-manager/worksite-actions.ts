"use server";

import { mapRegionDataToDeedComplete } from "@/lib/backend/api/internal/player-data";
import { fetchRegionDataPlayer } from "@/lib/backend/api/spl/spl-land-api";
import { DeedComplete } from "@/types/deed";
import { getAuthStatus } from "../auth-actions";

/**
 * Fetches a fresh copy of the authenticated player's full deed data from the
 * Splinterlands API and maps it to DeedComplete (worksite + staking joined).
 *
 * No caching — always fresh so the Worksites tab reflects the current state.
 */
export async function getPlayerWorksiteData(): Promise<{
  deeds: DeedComplete[];
  username: string | null;
  error?: string;
}> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) {
    return { deeds: [], username: null, error: "Not authenticated" };
  }

  try {
    const raw = await fetchRegionDataPlayer(auth.username);
    const deeds = mapRegionDataToDeedComplete(raw);
    return { deeds, username: auth.username };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { deeds: [], username: auth.username, error: msg };
  }
}
