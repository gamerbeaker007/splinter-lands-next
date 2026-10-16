import { SplSettingsResponse } from "@/types/spl/settings";
import { cacheLife } from "next/cache";
import { fetchSettings } from "../api/spl/spl-base-api";

/**
 * SPL `/settings`, shared by every visitor: `MaintenanceGuard` reads it on
 * every page render, so it must not cost an SPL call per request.
 * `"use cache"` (not NodeCache) because it runs during prerender. A failed
 * fetch throws so it is never cached; callers treat that as maintenance.
 */
export async function getCachedSettings(): Promise<SplSettingsResponse> {
  "use cache";
  cacheLife("minutes");

  const settings = await fetchSettings();
  if (!settings) throw new Error("SPL /settings unavailable");
  return settings;
}
