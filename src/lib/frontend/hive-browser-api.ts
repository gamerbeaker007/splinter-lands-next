"use client";

import type { HiveTxStatus } from "@/lib/shared/hive/waitForInclusion";

/**
 * Hive JSON-RPC from the visitor's browser. The nodes answer CORS for any
 * origin and are in the CSP `connect-src` (next.config.ts).
 */

const BROWSER_TIMEOUT_MS = 15_000;

/** Same nodes the server uses (lib/backend/api/hive/hive-account-api.ts). */
export const HIVE_NODES = [
  "https://api.hive.blog",
  "https://api.openhive.network",
  "https://rpc.mahdiyari.info",
  "https://api.deathwing.me",
];

/** One Hive JSON-RPC call, failing over to the next node on any error. */
export async function hiveCall(
  method: string,
  params: unknown
): Promise<unknown> {
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

/** Where a tx is: pending, in a block, expired (`transaction_status_api`). */
export async function findHiveTransaction(
  trxId: string
): Promise<HiveTxStatus> {
  const result = (await hiveCall("transaction_status_api.find_transaction", {
    transaction_id: trxId,
  })) as { status?: HiveTxStatus } | undefined;
  if (!result?.status) throw new Error("find_transaction: no status");
  return result.status;
}
