"use client";

import { splBrowser } from "@/lib/frontend/spl-browser-api";
import type { ValidatorVote } from "@/types/validator";

/**
 * The support page's per-user reads, run in the visitor's browser: DEC/SPS
 * from SPL, HIVE/HBD from a Hive node, validator votes from the validator API.
 * All three hosts answer CORS for any origin and are in the CSP `connect-src`
 * (next.config.ts). Recording a donation stays server-side (support-actions):
 * the server must read the amount off the chain itself before writing a row.
 */

const BROWSER_TIMEOUT_MS = 15_000;

/** Same nodes the server uses (lib/backend/api/hive/hive-account-api.ts). */
export const HIVE_NODES = [
  "https://api.hive.blog",
  "https://api.openhive.network",
  "https://rpc.mahdiyari.info",
  "https://api.deathwing.me",
];

const VALIDATOR_API = "https://validator.spl-stats.com";

/** One Hive JSON-RPC call, failing over to the next node on any error. */
async function hiveCall(method: string, params: unknown[]): Promise<unknown> {
  let lastError: unknown;
  for (const node of HIVE_NODES) {
    try {
      const res = await fetch(node, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
        signal: AbortSignal.timeout(BROWSER_TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(`${node} returned HTTP ${res.status}`);
      const body = (await res.json()) as { result?: unknown; error?: unknown };
      if (body.error) throw new Error(`${node}: ${JSON.stringify(body.error)}`);
      return body.result;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Hive RPC failed");
}

/** "12.345 HIVE" → 12.345 */
function assetAmount(asset: unknown): number {
  return Number.parseFloat(String(asset).split(" ")[0]) || 0;
}

async function fetchHiveBalances(
  username: string
): Promise<{ hive: number; hbd: number }> {
  const accounts = (await hiveCall("condenser_api.get_accounts", [
    [username],
  ])) as { balance?: string; hbd_balance?: string }[] | null;
  const account = accounts?.[0];
  if (!account) throw new Error(`Hive account not found: ${username}`);
  return {
    hive: assetAmount(account.balance),
    hbd: assetAmount(account.hbd_balance),
  };
}

export interface SupportBalances {
  dec: number;
  sps: number;
  hive: number;
  hbd: number;
  error?: string;
}

/** DEC/SPS and HIVE/HBD; one side failing still returns the other. */
export async function loadSupportBalances(
  username: string
): Promise<SupportBalances> {
  const [splResult, hiveResult] = await Promise.allSettled([
    splBrowser.fetchPlayerBalances(username, ["DEC", "SPS"]),
    fetchHiveBalances(username),
  ]);

  const result: SupportBalances = { dec: 0, sps: 0, hive: 0, hbd: 0 };
  const errors: string[] = [];

  if (splResult.status === "fulfilled") {
    for (const b of splResult.value) {
      if (b.token === "DEC") result.dec = Number(b.balance);
      if (b.token === "SPS") result.sps = Number(b.balance);
    }
  } else {
    errors.push("Could not load DEC/SPS balances");
  }

  if (hiveResult.status === "fulfilled") {
    result.hive = hiveResult.value.hive;
    result.hbd = hiveResult.value.hbd;
  } else {
    errors.push("Could not load HIVE/HBD balances");
  }

  if (errors.length > 0) result.error = errors.join("; ");
  return result;
}

/** The account's validator votes. */
export async function loadValidatorVotes(
  username: string
): Promise<{ votes: ValidatorVote[]; error?: string }> {
  try {
    const query = new URLSearchParams({ account: username });
    const res = await fetch(`${VALIDATOR_API}/votes_by_account?${query}`, {
      signal: AbortSignal.timeout(BROWSER_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`Validator API returned HTTP ${res.status}`);
    const data: unknown = await res.json();
    if (!Array.isArray(data))
      throw new Error("Invalid response from validator API");
    return { votes: data as ValidatorVote[] };
  } catch (error) {
    return {
      votes: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
