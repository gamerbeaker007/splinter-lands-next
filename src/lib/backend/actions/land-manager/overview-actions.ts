"use server";

import {
  fetchSplHarvestableResources,
  fetchLandResourcesPools,
  fetchSplPlayerResourceBalance,
  fetchProductionOverview,
  fetchRegionResourceBalance,
} from "@/lib/backend/api/spl/spl-land-api";
import {
  SplHarvestableResource,
  SplPlayerResourceBalance,
  SplProductionOverviewRegion,
} from "@/types/spl/landManager";
import { SplLandPool } from "@/types/spl/landPools";
import { cookies } from "next/headers";
import { getAuthStatus } from "../auth-actions";
import { fetchPlayerBalances } from "@/lib/backend/api/spl/spl-base-api";

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

export async function getBulkRegionData(regionUids: string[]): Promise<{
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

  return { harvestable, balances };
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
