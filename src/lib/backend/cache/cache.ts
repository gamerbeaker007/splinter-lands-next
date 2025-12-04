import NodeCache from "node-cache";

// Ensure singleton pattern for cache instances
// Use globalThis to persist across hot reloads in development
const globalForCache = globalThis as unknown as {
  cache: NodeCache | undefined;
  dailyCache: NodeCache | undefined;
};

export const cache =
  globalForCache.cache ?? new NodeCache({ stdTTL: 3600, useClones: false }); // TTL = 1 hour
export const dailyCache =
  globalForCache.dailyCache ??
  new NodeCache({ stdTTL: 90000, useClones: false }); // TTL = 1 day and 1 hour

// Always persist to globalThis (works in both dev and production)
globalForCache.cache = cache;
globalForCache.dailyCache = dailyCache;

if (process.env.NODE_ENV !== "production") {
  console.log("Cache instance initialized/reused");
}
