"use server";

import { fetchSettings } from "@/lib/backend/api/spl/spl-base-api";
import { cache } from "@/lib/backend/cache/cache";
import { SplSettingsResponse } from "@/types/spl/settings";

const SETTINGS_TTL_SECONDS = 60;

/**
 * Season dates from SPL `/settings` — shared data, cached briefly. The rental
 * renewal plan itself is built in the browser from the player's own card
 * collection (lib/shared/rentals.ts).
 */
export async function getSeasonSettings(): Promise<SplSettingsResponse | null> {
  const key = "spl-settings:season";
  const cached = cache.get<SplSettingsResponse>(key);
  if (cached) return cached;
  const settings = await fetchSettings();
  if (settings) cache.set(key, settings, SETTINGS_TTL_SECONDS);
  return settings;
}
