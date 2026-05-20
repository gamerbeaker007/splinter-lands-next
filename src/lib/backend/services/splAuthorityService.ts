import { fetchPlayerAuthorities } from "@/lib/backend/api/spl/spl-base-api";
import { cache } from "@/lib/backend/cache/cache";
import logger from "@/lib/backend/log/logger.server";

const AUTHORITY_TTL_SEC = 300;

function cacheKey(player: string): string {
  return `spl-authority:${player.toLowerCase()}`;
}

export function getServiceAccount(): string | null {
  const raw = process.env.SPL_LAND_SERVICE_ACCOUNT?.trim();
  return raw ? raw.toLowerCase() : null;
}

export function isServiceBroadcastConfigured(): boolean {
  return Boolean(
    getServiceAccount() && process.env.SPL_LAND_SERVICE_ACTIVE_KEY?.trim()
  );
}

export interface RentalAuthorityInfo {
  /** True iff the service account is in the player's `authorities.rental[]`. */
  authorized: boolean;
  /** The full current rental list — clients merge into this when granting. */
  rental: string[];
}

/**
 * Reads the player's rental authority list and reports both the current
 * membership of the service account and the full list (so callers building
 * a grant/revoke op can smart-merge instead of clobbering other authorities).
 *
 * Cached for 5 minutes per player.
 */
export async function getRentalAuthorityInfo(
  player: string
): Promise<RentalAuthorityInfo> {
  const service = getServiceAccount();
  if (!service || !player) return { authorized: false, rental: [] };

  const key = cacheKey(player);
  const cached = cache.get<RentalAuthorityInfo>(key);
  if (cached !== undefined) return cached;

  try {
    const rows = await fetchPlayerAuthorities([player]);
    const row = rows.find(
      (r) => r.name?.toLowerCase() === player.toLowerCase()
    );
    const rental = row?.authorities?.rental ?? [];
    const authorized = rental.map((p) => p.toLowerCase()).includes(service);
    const info: RentalAuthorityInfo = { authorized, rental };
    cache.set(key, info, AUTHORITY_TTL_SEC);
    return info;
  } catch (err) {
    logger.warn(
      `getRentalAuthorityInfo lookup failed for ${player}: ${err instanceof Error ? err.message : err}`
    );
    return { authorized: false, rental: [] };
  }
}

export function invalidateAuthorityCache(player: string): void {
  cache.del(cacheKey(player));
}
