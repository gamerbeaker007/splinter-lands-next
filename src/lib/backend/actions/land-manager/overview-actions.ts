"use server";

import {
  fetchHarvestableResources,
  fetchLandResourcesPools,
  fetchPlayerResourceBalance,
  fetchProductionOverview,
  fetchRegionResourceBalance,
  fetchSwapQuote,
} from "@/lib/backend/api/spl/spl-land-api";
import {
  HarvestableResource,
  PlayerResourceBalance,
  ProductionOverviewRegion,
  RegionResourceBalance,
  SERVICE_FEE_RECIPIENT_REGION,
  TRADE_HUB_FEE_PCT,
} from "@/types/landManager";
import { SplLandPool } from "@/types/spl/landPools";
import { cookies } from "next/headers";
import { getAuthStatus } from "../auth-actions";

async function getJwtToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("jwt_token")?.value ?? null;
}

export async function getProductionOverview(): Promise<{
  regions: ProductionOverviewRegion[];
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

export async function getHarvestableResources(
  regionUid: string
): Promise<{ data: HarvestableResource[]; error?: string }> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) {
    return { data: [], error: "Not authenticated" };
  }
  const jwt = await getJwtToken();
  if (!jwt) return { data: [], error: "No session token" };

  try {
    const data = await fetchHarvestableResources(auth.username, regionUid, jwt);
    return { data };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { data: [], error: msg };
  }
}

export async function getPlayerResourceBalances(): Promise<{
  balances: PlayerResourceBalance[];
  error?: string;
}> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) {
    return { balances: [], error: "Not authenticated" };
  }
  const jwt = await getJwtToken();
  if (!jwt) return { balances: [], error: "No session token" };

  try {
    const balances = await fetchPlayerResourceBalance(auth.username, jwt);
    return { balances };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { balances: [], error: msg };
  }
}

export async function getRegionResourceBalance(regionUid: string): Promise<{
  balance: RegionResourceBalance;
  error?: string;
}> {
  const defaultBalance: RegionResourceBalance = {
    grain: 0,
    wood: 0,
    stone: 0,
    iron: 0,
    aura: 0,
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

export async function getSwapQuote(
  fromRegionUid: string,
  symbol: string,
  amount: number
): Promise<{ out_amount_1: number; out_amount_2: number; error?: string }> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) {
    return {
      out_amount_1: 0,
      out_amount_2: amount,
      error: "Not authenticated",
    };
  }
  const jwt = await getJwtToken();
  if (!jwt)
    return {
      out_amount_1: 0,
      out_amount_2: parseFloat(
        (amount * (1 - TRADE_HUB_FEE_PCT / 100)).toFixed(3)
      ),
      error: "No session token",
    };

  try {
    const quote = await fetchSwapQuote(
      fromRegionUid,
      SERVICE_FEE_RECIPIENT_REGION,
      symbol,
      amount,
      jwt
    );
    return quote;
  } catch {
    const feeMultiplier = 1 - TRADE_HUB_FEE_PCT / 100;
    return {
      out_amount_1: 0,
      out_amount_2: parseFloat((amount * feeMultiplier).toFixed(3)),
      error: "Quote unavailable",
    };
  }
}

// ── Bulk region data (harvestable + balance for multiple regions) ──────────

export async function getBulkRegionData(regionUids: string[]): Promise<{
  harvestable: Record<string, HarvestableResource[]>;
  balances: Record<string, RegionResourceBalance>;
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
      fetchHarvestableResources(auth.username!, uid, jwt).then((d) => ({
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

  const harvestable: Record<string, HarvestableResource[]> = {};
  const balances: Record<string, RegionResourceBalance> = {};

  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    const v = r.value;
    if (v.type === "harvestable")
      harvestable[v.uid] = v.data as HarvestableResource[];
    else balances[v.uid] = v.data as RegionResourceBalance;
  }

  return { harvestable, balances };
}

// ── Cross-symbol / cross-region resource quote ────────────────────────────

export async function getResourceQuote(
  fromRegionUid: string,
  toRegionUid: string,
  fromSymbol: string,
  toSymbol: string,
  amount: number
): Promise<{ out_amount_1: number; out_amount_2: number; error?: string }> {
  const fallback = parseFloat(
    (amount * (1 - TRADE_HUB_FEE_PCT / 100)).toFixed(3)
  );
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) {
    return {
      out_amount_1: 0,
      out_amount_2: fallback,
      error: "Not authenticated",
    };
  }
  const jwt = await getJwtToken();
  if (!jwt)
    return {
      out_amount_1: 0,
      out_amount_2: fallback,
      error: "No session token",
    };

  try {
    return await fetchSwapQuote(
      fromRegionUid,
      toRegionUid,
      fromSymbol,
      amount,
      jwt,
      toSymbol
    );
  } catch {
    return {
      out_amount_1: 0,
      out_amount_2: fallback,
      error: "Quote unavailable",
    };
  }
}

// ── DEC balance ───────────────────────────────────────────────────────────

export async function getDecBalance(): Promise<{
  dec: number;
  error?: string;
}> {
  const { balances, error } = await getPlayerResourceBalances();
  const decEntry = balances.find(
    (b) => b.token_symbol === "DEC" || b.token_symbol === "dec"
  );
  return { dec: decEntry?.balance ?? 0, error };
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
