"use client";

import {
  getBulkRegionData,
  getPlayerMythicDeeds,
} from "@/lib/frontend/land-data";
import { getProductionPageData } from "@/lib/frontend/land-production-data";

/**
 * Background warm-up of the Harvest and Production pages, the pair players
 * switch between. Each fills the same browser memos the page reads on mount,
 * so opening the page within the memo TTL (60 s) renders without waiting.
 * Failures are ignored here — the page reports them when it loads itself.
 */

/** Harvest: region table + summary (per region) and the mythic deeds. */
function prefetchHarvestData(enabledRegionUids: string[]): void {
  if (enabledRegionUids.length > 0) {
    void getBulkRegionData(enabledRegionUids).catch(() => {});
  }
  void getPlayerMythicDeeds().catch(() => {});
}

/** Production: the enriched deed table. */
function prefetchProductionData(): void {
  void getProductionPageData().catch(() => {});
}

const PREFETCHERS: Record<string, (enabledRegionUids: string[]) => void> = {
  "/land-manager/harvest": prefetchHarvestData,
  "/land-manager/production": prefetchProductionData,
};

/** The page whose data is warmed while the player is on `pathname`. */
const COUNTERPARTS: Record<string, string> = {
  "/land-manager/harvest": "/land-manager/production",
  "/land-manager/production": "/land-manager/harvest",
};

/** Warms `href`'s data, if it is a page with a prefetcher. */
export function prefetchLandManagerPage(
  href: string,
  enabledRegionUids: string[]
): void {
  PREFETCHERS[href]?.(enabledRegionUids);
}

/** The page to warm in the background while on `pathname`, if any. */
export function landManagerCounterpart(pathname: string | null): string | null {
  const page = Object.keys(COUNTERPARTS).find((href) =>
    pathname?.startsWith(href)
  );
  return page ? COUNTERPARTS[page] : null;
}
