/**
 * Limits on what the land-service account signs for a player — server-side
 * only. Does NOT have the "use server" directive.
 *
 * Chunking bounds the size of one transaction, not the total work: without
 * these limits one account could make the service sign (and pay Hive resource
 * credits for) unbounded batches, in parallel.
 */

/** Most listings one buy/rent request may cover (20 ops, 5 broadcasts). */
export const MAX_ITEMS_PER_SERVICE_REQUEST = 2000;
/** Service-signed requests running at once, across all players. */
export const MAX_CONCURRENT_SERVICE_REQUESTS = 8;

const MARKET_ID_RE = /^[A-Za-z0-9_-]{1,100}$/;

/** Error text when the listings are malformed or too many; null when fine. */
export function validateMarketIds(marketIds: unknown): string | null {
  if (!Array.isArray(marketIds)) return "Invalid market IDs.";
  if (marketIds.length > MAX_ITEMS_PER_SERVICE_REQUEST) {
    return `Too many listings in one request (max ${MAX_ITEMS_PER_SERVICE_REQUEST}).`;
  }
  if (
    !marketIds.every((id) => typeof id === "string" && MARKET_ID_RE.test(id))
  ) {
    return "Invalid market IDs.";
  }
  if (new Set(marketIds).size !== marketIds.length) {
    return "Duplicate market IDs.";
  }
  return null;
}

/** Error text when a listing price is not a positive finite number; else null. */
export function validatePrices(prices: unknown[]): string | null {
  return prices.every(
    (p) => typeof p === "number" && Number.isFinite(p) && p > 0
  )
    ? null
    : "Invalid listing price.";
}

const inFlightPlayers = new Set<string>();

/**
 * Runs `fn` while holding the player's service-signing slot: one request per
 * player at a time, at most MAX_CONCURRENT_SERVICE_REQUESTS overall. Returns
 * null without running `fn` when no slot is free.
 */
export async function withServiceBroadcastSlot<T>(
  player: string,
  fn: () => Promise<T>
): Promise<T | null> {
  if (
    inFlightPlayers.has(player) ||
    inFlightPlayers.size >= MAX_CONCURRENT_SERVICE_REQUESTS
  ) {
    return null;
  }
  inFlightPlayers.add(player);
  try {
    return await fn();
  } finally {
    inFlightPlayers.delete(player);
  }
}
