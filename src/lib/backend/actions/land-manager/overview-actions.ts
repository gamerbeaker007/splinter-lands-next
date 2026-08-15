"use server";

import {
  fetchPlayerBalances,
  fetchTransactionLookup,
} from "@/lib/backend/api/spl/spl-base-api";
import {
  fetchLandResourcesPools,
  fetchPlayerResourcePoolPosition,
  fetchPowerCoreAvailableIds,
  fetchPowerCoreCount,
  fetchProductionOverview,
  fetchRegionDataPlayer,
  fetchRegionOverview,
  fetchRegionResourceBalance,
  fetchSplHarvestableResources,
  fetchSplPlayerResourceBalance,
  fetchTaxes,
  regionBalanceFrom,
} from "@/lib/backend/api/spl/spl-land-api";
import { cache } from "@/lib/backend/cache/cache";
import { MythicDeed } from "@/types/landManager";
import {
  SplHarvestableResource,
  SplPlayerResourceBalance,
  SplProductionOverviewRegion,
  SplRegionOverviewData,
} from "@/types/spl/landManager";
import { SplLandPool, SplPlayerPoolPosition } from "@/types/spl/landPools";
import type { TrxLookupOutcome } from "@/types/spl/trx";
import { cookies } from "next/headers";
import { getAuthStatus } from "../auth-actions";

const BULK_REGION_CACHE_TTL = 30; // seconds

async function getJwtToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("jwt_token")?.value ?? null;
}

export async function getProductionOverview(): Promise<{
  regions: SplProductionOverviewRegion[];
  error?: string;
}> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) {
    return { regions: [], error: "Not authenticated" };
  }
  const jwt = await getJwtToken();
  if (!jwt) return { regions: [], error: "No session token" };

  try {
    const { regions } = await fetchProductionOverview(auth.username, jwt);
    return { regions };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { regions: [], error: msg };
  }
}

export async function getSplHarvestableResources(
  regionUid: string
): Promise<{ data: SplHarvestableResource[]; error?: string }> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) {
    return { data: [], error: "Not authenticated" };
  }
  const jwt = await getJwtToken();
  if (!jwt) return { data: [], error: "No session token" };

  try {
    const data = await fetchSplHarvestableResources(
      auth.username,
      regionUid,
      jwt
    );
    return { data };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { data: [], error: msg };
  }
}

export async function getSplPlayerResourceBalances(): Promise<{
  balances: SplPlayerResourceBalance[];
  error?: string;
}> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) {
    return { balances: [], error: "Not authenticated" };
  }
  const jwt = await getJwtToken();
  if (!jwt) return { balances: [], error: "No session token" };

  try {
    const balances = await fetchSplPlayerResourceBalance(auth.username, jwt);
    return { balances };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { balances: [], error: msg };
  }
}

export async function getRegionResourceBalance(regionUid: string): Promise<{
  balance: Record<string, number>;
  error?: string;
}> {
  const defaultBalance: Record<string, number> = {
    GRAIN: 0,
    WOOD: 0,
    STONE: 0,
    IRON: 0,
    AURA: 0,
  };
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) {
    return { balance: defaultBalance, error: "Not authenticated" };
  }
  const jwt = await getJwtToken();
  if (!jwt) return { balance: defaultBalance, error: "No session token" };

  try {
    const balance = await fetchRegionResourceBalance(
      auth.username,
      regionUid,
      jwt
    );
    return { balance };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { balance: defaultBalance, error: msg };
  }
}

// ── Bulk region data (harvestable + balance for multiple regions) ──────────

/**
 * Drop every cached region/liquidity snapshot for the signed-in player.
 *
 * Call this after an on-chain action that moves resources, DEC or liquidity, and
 * BEFORE triggering a UI refresh. Without it, panels that read with `force:
 * false` (RegionResourceSummary, the pool-buffer alert) can win a cache hit on a
 * snapshot taken while the plan was being built — i.e. pre-action balances — and
 * appear not to have refreshed at all. Plan-time `force: true` reads make this
 * worse rather than better, because they re-prime the cache moments before the
 * broadcast lands.
 *
 * Keys are cleared by prefix: callers pass different region-uid sets, so one
 * player has several distinct cache entries.
 */
export async function invalidatePlayerRegionCaches(): Promise<void> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) return;

  const prefixes = [
    `bulk-region:${auth.username}:`,
    `pool-positions:${auth.username}:`,
  ];
  const stale = cache
    .keys()
    .filter((key) => prefixes.some((prefix) => key.startsWith(prefix)));
  if (stale.length > 0) cache.del(stale);
}

export interface BulkRegionData {
  harvestable: Record<string, SplHarvestableResource[]>;
  balances: Record<string, Record<string, number>>;
  /**
   * region_uid → the raw production overview. Carries the per-plot worksite rows
   * and the region's `resource_recipes`, which is what consumption RATES are
   * derived from (see `regionConsumptionPerHour`). It comes from the same
   * response as `balances`, so exposing it costs no extra request.
   */
  overviews: Record<string, SplRegionOverviewData>;
  error?: string;
}

export async function getBulkRegionData(
  regionUids: string[],
  force = false
): Promise<BulkRegionData> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) {
    return {
      harvestable: {},
      balances: {},
      overviews: {},
      error: "Not authenticated",
    };
  }
  const jwt = await getJwtToken();
  if (!jwt)
    return {
      harvestable: {},
      balances: {},
      overviews: {},
      error: "No session token",
    };

  const cacheKey = `bulk-region:${auth.username}:${[...regionUids].sort().join(",")}`;

  if (!force) {
    const cached = cache.get<Omit<BulkRegionData, "error">>(cacheKey);
    if (cached) return cached;
  }

  const results = await Promise.allSettled(
    regionUids.flatMap((uid) => [
      fetchSplHarvestableResources(auth.username!, uid, jwt).then((d) => ({
        type: "harvestable" as const,
        uid,
        data: d,
      })),
      fetchRegionOverview(auth.username!, uid, jwt).then((o) => ({
        type: "overview" as const,
        uid,
        data: o,
      })),
    ])
  );

  const harvestable: Record<string, SplHarvestableResource[]> = {};
  const balances: Record<string, Record<string, number>> = {};
  const overviews: Record<string, SplRegionOverviewData> = {};

  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    const v = r.value;
    if (v.type === "harvestable") {
      harvestable[v.uid] = v.data;
    } else {
      balances[v.uid] = regionBalanceFrom(v.data);
      if (v.data) overviews[v.uid] = v.data;
    }
  }

  const fresh = { harvestable, balances, overviews };
  cache.set(cacheKey, fresh, BULK_REGION_CACHE_TTL);
  return fresh;
}

// ── DEC balance ───────────────────────────────────────────────────────────

export async function getDecBalance(username: string): Promise<number> {
  const balances = await fetchPlayerBalances(username, ["DEC"]);
  const decEntry = balances.find((b) => b.token === "DEC" || b.token === "dec");
  return Number(decEntry?.balance ?? 0);
}

// ── Land pools (public — no auth required) ────────────────────────────────

export async function getLandPools(): Promise<{
  pools: SplLandPool[];
  error?: string;
}> {
  try {
    const pools = await fetchLandResourcesPools();
    return { pools };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { pools: [], error: msg };
  }
}

// ── Player liquidity positions (public — no auth required) ────────────────

const POOL_POSITION_CACHE_TTL = 30; // seconds

/**
 * The player's LP position in each requested resource pool, keyed by symbol.
 * A pool the player has no position in is returned with zeroed shares rather
 * than omitted, so callers can index without null checks.
 */
export async function getPlayerPoolPositions(
  player: string,
  symbols: string[],
  force = false
): Promise<Record<string, SplPlayerPoolPosition>> {
  const cacheKey = `pool-positions:${player}:${[...symbols].sort().join(",")}`;
  if (!force) {
    const cached = cache.get<Record<string, SplPlayerPoolPosition>>(cacheKey);
    if (cached) return cached;
  }

  const results = await Promise.allSettled(
    symbols.map((symbol) => fetchPlayerResourcePoolPosition(player, symbol))
  );

  const positions: Record<string, SplPlayerPoolPosition> = {};
  symbols.forEach((symbol, i) => {
    const r = results[i];
    positions[symbol] =
      r.status === "fulfilled"
        ? r.value
        : { symbol, shares: 0, vestingShares: 0 };
  });

  cache.set(cacheKey, positions, POOL_POSITION_CACHE_TTL);
  return positions;
}

// ── Mythic deeds (Keeps & Castles) ───────────────────────────────────────────

export async function getPlayerMythicDeeds(): Promise<MythicDeed[]> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) return [];

  const { deeds, worksite_details } = await fetchRegionDataPlayer(
    auth.username
  );

  const mythicDeeds = deeds.filter(
    (d) => (d.keep ?? 0) > 0 || (d.castle ?? 0) > 0
  );

  if (mythicDeeds.length === 0) return [];

  const taxResults = await Promise.allSettled(
    mythicDeeds.map((d) => fetchTaxes(d.deed_uid))
  );

  const result: MythicDeed[] = mythicDeeds.map((deed, i) => {
    const wsDetail = worksite_details.find((w) => w.deed_uid === deed.deed_uid);
    const taxResult = taxResults[i];
    const taxes =
      taxResult.status === "fulfilled"
        ? taxResult.value.taxes.filter((t) => t.balance > 0)
        : [];
    const capacity =
      taxResult.status === "fulfilled" ? taxResult.value.capacity : 0;
    const kingdom_type: "keep" | "castle" =
      (deed.keep ?? 0) > 0 ? "keep" : "castle";

    return {
      deed_uid: deed.deed_uid,
      region_uid: deed.region_uid,
      region_number: deed.region_number,
      tract_number: deed.tract_number,
      kingdom_type,
      last_action_time: wsDetail?.last_action_time ?? null,
      estimated_totem_chance: wsDetail?.estimated_totem_chance ?? null,
      taxes,
      capacity,
    };
  });

  // Keeps first, then castles
  return result.sort((a, b) => {
    if (a.kingdom_type === b.kingdom_type) return 0;
    return a.kingdom_type === "keep" ? -1 : 1;
  });
}

// ── Transaction lookup wrapper ────────────────────────────────────────────────

export async function lookupTransaction(
  trxId: string
): Promise<TrxLookupOutcome> {
  return fetchTransactionLookup(trxId);
}

// ── Power Core inventory ──────────────────────────────────────────────────────

export async function getPowerCoreInfo(): Promise<{
  count: number;
  ids: string[];
  error?: string;
}> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) {
    return { count: 0, ids: [], error: "Not authenticated" };
  }
  try {
    const count = await fetchPowerCoreCount(auth.username);
    if (count === 0) return { count: 0, ids: [] };
    const allIds: string[] = [];
    let offset = 0;
    const limit = 100;
    while (allIds.length < count) {
      const batch = await fetchPowerCoreAvailableIds(
        auth.username,
        offset,
        limit
      );
      if (batch.length === 0) break;
      allIds.push(...batch);
      if (batch.length < limit) break;
      offset += limit;
    }
    return { count, ids: allIds };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { count: 0, ids: [], error: msg };
  }
}
