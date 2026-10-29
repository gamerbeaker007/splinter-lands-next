import { fetchHiveHeadBlock } from "@/lib/backend/api/hive/hive-account-api";
import { splServerReads } from "@/lib/backend/api/spl/spl-clients";
import { cache } from "@/lib/backend/cache/cache";
import type { ChainStatus } from "@/lib/shared/hive/sequencedBroadcast";

const CACHE_KEY = "chain-status";
const CACHE_TTL_SECONDS = 5;

let inFlight: Promise<ChainStatus> | null = null;

/**
 * Hive head + SPL's last processed block. The same for every visitor, so it
 * is read once per 5 s for all of them: the lag warning and every running
 * broadcast sequencer poll this instead of SPL and Hive directly.
 */
export function getChainStatus(): Promise<ChainStatus> {
  const cached = cache.get<ChainStatus>(CACHE_KEY);
  if (cached) return Promise.resolve(cached);
  inFlight ??= Promise.all([
    fetchHiveHeadBlock(),
    splServerReads.fetchLastBlock(),
  ])
    .then(([hiveHeadBlock, splLastBlock]) => {
      const status = { hiveHeadBlock, splLastBlock };
      cache.set(CACHE_KEY, status, CACHE_TTL_SECONDS);
      return status;
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}
