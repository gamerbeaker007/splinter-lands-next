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

export interface PurchaseAuthorityInfo {
  /** True iff the service account is in the player's `authorities.purchase[]`. */
  authorized: boolean;
  /** The full current purchase list — clients merge into this when granting. */
  purchase: string[];
}

interface CachedAuthorities {
  rental: string[];
  purchase: string[];
}

/**
 * Reads (and caches for 5 minutes) the player's full authority lists. One
 * fetch serves both the rental and purchase authority checks.
 */
async function getPlayerAuthorities(
  player: string
): Promise<CachedAuthorities> {
  const key = cacheKey(player);
  const cached = cache.get<CachedAuthorities>(key);
  if (cached !== undefined) return cached;

  try {
    const rows = await fetchPlayerAuthorities([player]);
    const row = rows.find(
      (r) => r.name?.toLowerCase() === player.toLowerCase()
    );
    const info: CachedAuthorities = {
      rental: row?.authorities?.rental ?? [],
      purchase: row?.authorities?.purchase ?? [],
    };
    cache.set(key, info, AUTHORITY_TTL_SEC);
    return info;
  } catch (err) {
    logger.warn(
      `getPlayerAuthorities lookup failed for ${player}: ${err instanceof Error ? err.message : err}`
    );
    return { rental: [], purchase: [] };
  }
}

/**
 * Reads the player's rental authority list and reports both the current
 * membership of the service account and the full list (so callers building
 * a grant/revoke op can smart-merge instead of clobbering other authorities).
 */
export async function getRentalAuthorityInfo(
  player: string
): Promise<RentalAuthorityInfo> {
  const service = getServiceAccount();
  if (!service || !player) return { authorized: false, rental: [] };

  const { rental } = await getPlayerAuthorities(player);
  const authorized = rental.map((p) => p.toLowerCase()).includes(service);
  return { authorized, rental };
}

/**
 * Purchase counterpart of {@link getRentalAuthorityInfo} — needed for the
 * land-service account to sign `sm_market_purchase` on the player's behalf.
 */
export async function getPurchaseAuthorityInfo(
  player: string
): Promise<PurchaseAuthorityInfo> {
  const service = getServiceAccount();
  if (!service || !player) return { authorized: false, purchase: [] };

  const { purchase } = await getPlayerAuthorities(player);
  const authorized = purchase.map((p) => p.toLowerCase()).includes(service);
  return { authorized, purchase };
}

export function invalidateAuthorityCache(player: string): void {
  cache.del(cacheKey(player));
}
