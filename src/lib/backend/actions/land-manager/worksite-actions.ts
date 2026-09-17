"use server";

import { mapRegionDataToDeedComplete } from "@/lib/backend/api/internal/player-data";
import { fetchRegionDataPlayer } from "@/lib/backend/api/spl/spl-land-api";
import { DeedComplete } from "@/types/deed";
import { getAuthStatus } from "../auth-actions";

export interface PlayerWorksiteData {
  deeds: DeedComplete[];
  username: string | null;
  error?: string;
}

/**
 * player → the fetch currently running for them.
 *
 * Deliberately NOT a TTL cache: the Worksites page refreshes right after a
 * broadcast and must see the result, so a cached snapshot would read back
 * pre-action state. Coalescing only shares a request that is still in flight,
 * which is what happens when the Worksites page and the Alerts panel both mount
 * and ask for the same data in the same tick. A later refresh still goes out.
 */
const inFlightWorksiteData = new Map<string, Promise<PlayerWorksiteData>>();

/**
 * Fetches a fresh copy of the authenticated player's full deed data from the
 * Splinterlands API and maps it to DeedComplete (worksite + staking joined).
 *
 * No caching — always fresh so the Worksites page reflects the current state.
 */
export async function getPlayerWorksiteData(): Promise<PlayerWorksiteData> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) {
    return { deeds: [], username: null, error: "Not authenticated" };
  }
  const player = auth.username;

  const pending = inFlightWorksiteData.get(player);
  if (pending) return pending;

  const run = (async (): Promise<PlayerWorksiteData> => {
    try {
      const raw = await fetchRegionDataPlayer(player);
      const deeds = mapRegionDataToDeedComplete(raw);
      return { deeds, username: player };
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      return { deeds: [], username: player, error: msg };
    }
  })();

  inFlightWorksiteData.set(player, run);
  try {
    return await run;
  } finally {
    if (inFlightWorksiteData.get(player) === run)
      inFlightWorksiteData.delete(player);
  }
}
