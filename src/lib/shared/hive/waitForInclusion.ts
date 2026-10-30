import { HIVE_BLOCK_SECONDS } from "@/lib/shared/hive/splCatchUp";

/** `transaction_status_api.find_transaction` statuses (hived). */
export type HiveTxStatus =
  | "unknown"
  | "within_mempool"
  | "within_reversible_block"
  | "within_irreversible_block"
  | "expired_reversible"
  | "expired_irreversible"
  | "too_old";

export type Inclusion = "included" | "expired" | "unknown";

export interface InclusionDeps {
  findTransaction: (trxId: string) => Promise<HiveTxStatus>;
  sleep: (ms: number) => Promise<void>;
  now: () => number;
}

const POLL_MS = 1_000;

/**
 * Waits until a tx is in a block, then one block more. Pure; the browser and
 * the on-behalf service bind it to their own Hive lookup.
 *
 * Why this and not a fixed delay: hived allows 5 custom ops per account per
 * block, counted over the node's *pending* pool, so the next batch may only go
 * once this one left it. The extra block covers the broadcasting node (e.g.
 * Keychain's) being a block behind the node we ask.
 *
 * "expired": provably never executed. "unknown": the node can't tell (lookup
 * failing, or still not in a block after `timeoutMs`) — it may still land.
 */
export async function waitForInclusion(
  trxId: string,
  deps: InclusionDeps,
  timeoutMs: number
): Promise<Inclusion> {
  const deadline = deps.now() + timeoutMs;
  let lookupFailures = 0;
  while (deps.now() < deadline) {
    let status: HiveTxStatus;
    try {
      status = await deps.findTransaction(trxId);
    } catch {
      // A lookup hiccup isn't an answer; give up only when it persists.
      if (++lookupFailures >= 3) return "unknown";
      await deps.sleep(POLL_MS);
      continue;
    }
    if (status.startsWith("within_") && status !== "within_mempool") {
      await deps.sleep(HIVE_BLOCK_SECONDS * 1000);
      return "included";
    }
    if (status.startsWith("expired_") || status === "too_old") {
      return "expired";
    }
    await deps.sleep(POLL_MS);
  }
  return "unknown";
}
