"use client";

/** Every cache's `invalidate`, for the cross-cache helpers below. */
const registry = new Set<(prefix?: string) => void>();

/**
 * Tiny in-tab memo for browser SPL reads. Concurrent callers for the same key
 * share one in-flight request, and a successful result is reused for `ttlMs`
 * then dropped. Failures are never cached.
 *
 * Scope is one browser tab: it dedupes requests between components and page
 * navigations, not across visitors — shared data belongs in the server cache.
 *
 * `invalidate(prefix)` drops matching entries; call it after a broadcast that
 * changes the data (key per-player entries as `<player>:...`), so the next
 * read after the action is live.
 */
export function createBrowserCache<T>(ttlMs: number) {
  const entries = new Map<string, Promise<T>>();

  function cached(key: string, load: () => Promise<T>): Promise<T> {
    const hit = entries.get(key);
    if (hit) return hit;

    const promise = load();
    entries.set(key, promise);
    const evict = () => {
      if (entries.get(key) === promise) entries.delete(key);
    };
    promise.then(() => setTimeout(evict, ttlMs), evict);
    return promise;
  }

  function invalidate(prefix = "") {
    for (const key of [...entries.keys()]) {
      if (key.startsWith(prefix)) entries.delete(key);
    }
  }

  registry.add(invalidate);
  return Object.assign(cached, { invalidate });
}

/**
 * Drops every browser cache entry for `player` (all caches key per player
 * first). Call after an on-chain action, before re-reading.
 */
export function invalidatePlayerBrowserCaches(player: string) {
  const prefix = `${player.toLowerCase()}:`;
  registry.forEach((invalidate) => invalidate(prefix));
}

/** Drops everything — e.g. on logout / account switch. */
export function clearBrowserCaches() {
  registry.forEach((invalidate) => invalidate());
}
