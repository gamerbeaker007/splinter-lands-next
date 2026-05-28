"use server";

import {
  fetchPlayerBalances,
  fetchTransactionLookup,
} from "@/lib/backend/api/spl/spl-base-api";
import {
  fetchLandResourcesPools,
  fetchPowerCoreAvailableIds,
  fetchPowerCoreCount,
  fetchProductionOverview,
  fetchRegionDataPlayer,
  fetchRegionResourceBalance,
  fetchSplHarvestableResources,
  fetchSplPlayerResourceBalance,
  fetchTaxes,
} from "@/lib/backend/api/spl/spl-land-api";
import { cache } from "@/lib/backend/cache/cache";
import { MythicDeed } from "@/types/landManager";
import {
  SplHarvestableResource,
  SplPlayerResourceBalance,
  SplProductionOverviewRegion,
} from "@/types/spl/landManager";
import { SplLandPool } from "@/types/spl/landPools";
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
    const regions = await fetchProductionOverview(auth.username, jwt);
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

export async function getBulkRegionData(
  regionUids: string[],
  force = false
): Promise<{
  harvestable: Record<string, SplHarvestableResource[]>;
  balances: Record<string, Record<string, number>>;
  error?: string;
}> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) {
    return { harvestable: {}, balances: {}, error: "Not authenticated" };
  }
  const jwt = await getJwtToken();
  if (!jwt) return { harvestable: {}, balances: {}, error: "No session token" };

  const cacheKey = `bulk-region:${auth.username}:${[...regionUids].sort().join(",")}`;

  if (!force) {
    const cached = cache.get<{
      harvestable: Record<string, SplHarvestableResource[]>;
      balances: Record<string, Record<string, number>>;
    }>(cacheKey);
    if (cached) return cached;
  }

  const results = await Promise.allSettled(
    regionUids.flatMap((uid) => [
      fetchSplHarvestableResources(auth.username!, uid, jwt).then((d) => ({
        type: "harvestable" as const,
        uid,
        data: d,
      })),
      fetchRegionResourceBalance(auth.username!, uid, jwt).then((b) => ({
        type: "balance" as const,
        uid,
        data: b,
      })),
    ])
  );

  const harvestable: Record<string, SplHarvestableResource[]> = {};
  const balances: Record<string, Record<string, number>> = {};

  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    const v = r.value;
    if (v.type === "harvestable")
      harvestable[v.uid] = v.data as SplHarvestableResource[];
    else balances[v.uid] = v.data as Record<string, number>;
  }

  const fresh = { harvestable, balances };
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
