import { createHash } from "crypto";

// Nearly every land-manager action calls getAuthStatus; 30 min keeps that to
// ~2 SPL verifications per hour per user. A revoked token is still caught by
// the 401 on the browser's own JWT reads, which logs the user out. Actions the
// service account signs for the player skip this cache (requireFreshPlayer).
const VERIFY_CACHE_TTL_MS = 30 * 60 * 1000;
const verifyCache = new Map<string, { username: string; expiresAt: number }>();

function tokenCacheKey(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function getCachedVerification(
  token: string
): { username: string } | undefined {
  const key = tokenCacheKey(token);
  const entry = verifyCache.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    verifyCache.delete(key);
    return undefined;
  }
  return { username: entry.username };
}

export function setCachedVerification(token: string, username: string): void {
  verifyCache.set(tokenCacheKey(token), {
    username,
    expiresAt: Date.now() + VERIFY_CACHE_TTL_MS,
  });
}

/** Drops one token's cached verification (logout, upstream rejection). */
export function deleteCachedVerification(token: string): void {
  verifyCache.delete(tokenCacheKey(token));
}

/** Exported for tests — clears all cached verification results. */
export function clearAuthVerificationCache(): void {
  verifyCache.clear();
}
