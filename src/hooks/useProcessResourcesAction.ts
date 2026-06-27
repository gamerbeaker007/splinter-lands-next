import { recordPostHarvestLog } from "@/lib/backend/actions/land-manager/log-actions";
import {
  getBulkRegionData,
  getDecBalance,
  getLandPools,
} from "@/lib/backend/actions/land-manager/overview-actions";
import { buildAddLiquidityOp } from "@/lib/shared/operations/opBuilders";
import { buildPostHarvestOps } from "@/lib/frontend/postHarvestOps";
import {
  BroadcastResult,
  broadcastOperations,
  waitForTransactions,
} from "@/lib/frontend/splBroadcast";
import {
  DryRunResult,
  PostHarvestActionSummary,
  PostHarvestStrategy,
} from "@/types/landManager";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import { SplLandPool } from "@/types/spl/landPools";
import { useCallback, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Params {
  username: string;
  visibleRegions: SplProductionOverviewRegion[];
  postHarvestStrategy: PostHarvestStrategy;
  excludedResources: string[];
  sellPct: number;
  poolPct: number;
  onSuccess?: () => void;
}

interface UseProcessResourcesAction {
  busy: boolean;
  result: BroadcastResult | null;
  error: string | null;
  warning: string | null;
  clearResult: () => void;
  clearError: () => void;
  clearWarning: () => void;
  execute: (isDryRun: boolean) => Promise<DryRunResult | null>;
}

interface LiquidityOp {
  regionUid: string;
  symbol: string;
  resourceAmount: number;
  decAmount: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

/**
 * Parse a liquidity op envelope to extract region_uid, resource_symbol,
 * and resource_amount from the JSON payload.
 */
function parseLiqOpEnvelope(op: [string, object]): {
  region_uid: string;
  resource_symbol: string;
  resource_amount: number;
  dec_amount: number;
} {
  const envelope = op[1] as { json: string };
  return JSON.parse(envelope.json);
}

/**
 * Sum total DEC across a set of liquidity op envelopes.
 */
function sumDecFromLiqOps(liqOps: [string, object][]): number {
  let total = 0;
  for (const op of liqOps) {
    total += parseLiqOpEnvelope(op).dec_amount;
  }
  return total;
}

/**
 * Append DEC balance info to the dry-run log when sell% is close to or
 * below pool% (within 5%). Estimates whether the user has enough DEC
 * (wallet + sell proceeds) to cover the pool portion.
 */
async function appendDecBalanceInfo(
  log: string[],
  username: string,
  dryRunLiqOps: [string, object][],
  actions: PostHarvestActionSummary[],
  sellPct: number,
  poolPct: number
): Promise<void> {
  if (poolPct <= 0 || dryRunLiqOps.length === 0 || sellPct >= poolPct + 5)
    return;

  const totalDecNeeded = sumDecFromLiqOps(dryRunLiqOps);

  let decFromSells = 0;
  for (const action of actions) {
    if (action.type === "sell_for_dec") {
      decFromSells += action.dec_amount;
    }
  }

  const decBalance = await getDecBalance(username);
  const availableAfterSells = decBalance + decFromSells;

  log.push(
    `DEC needed for pool: ~${fmt(totalDecNeeded)} DEC | Balance: ${fmt(decBalance)} DEC` +
      (decFromSells > 0
        ? ` + ~${fmt(decFromSells)} from sells = ~${fmt(availableAfterSells)} DEC`
        : "")
  );

  if (totalDecNeeded > availableAfterSells) {
    const ratio = availableAfterSells / totalDecNeeded;
    log.push(
      `WARNING: Not enough DEC for full pool portion. Pool amounts will be scaled to ${Math.floor(ratio * 100)}% of target.`
    );
  }
}

/**
 * Broadcast sell operations (Phase 1).
 * Returns the confirmed transaction IDs, or null if the broadcast failed.
 */
async function broadcastSellPhase(
  username: string,
  sellOps: [string, object][]
): Promise<{ txIds: string[] } | { error: string }> {
  if (sellOps.length === 0) return { txIds: [] };

  const res = await broadcastOperations(username, sellOps);
  if (!res.success) {
    return { error: res.error ?? "Broadcast failed (sell phase)" };
  }
  await waitForTransactions(res.txIds);
  return { txIds: res.txIds };
}

/**
 * Build liquidity ops from the dry-run plan, re-priced with fresh pool data.
 * Uses the resource amounts from buildPostHarvestOps (the correct split)
 * and only updates DEC amounts to reflect current pool ratios.
 */
function buildFreshLiquidityOps(
  dryRunLiqOps: [string, object][],
  freshPools: SplLandPool[]
): LiquidityOp[] {
  const poolMap = new Map(
    freshPools.map((p) => [
      p.token_symbol,
      {
        decQty: Number.parseFloat(p.dec_quantity),
        resourceQty: Number.parseFloat(p.resource_quantity),
      },
    ])
  );

  const ops: LiquidityOp[] = [];
  for (const liqOp of dryRunLiqOps) {
    const parsed = parseLiqOpEnvelope(liqOp);
    const pool = poolMap.get(parsed.resource_symbol);
    if (!pool || pool.resourceQty <= 0) continue;

    // 99% safety margin on the planned resource amount
    const resourceAmount = Number.parseFloat(
      (parsed.resource_amount * 0.99).toFixed(3)
    );
    if (resourceAmount <= 0) continue;

    const decAmount = Number.parseFloat(
      (resourceAmount * (pool.decQty / pool.resourceQty)).toFixed(3)
    );
    if (decAmount <= 0) continue;

    ops.push({
      regionUid: parsed.region_uid,
      symbol: parsed.resource_symbol,
      resourceAmount,
      decAmount,
    });
  }
  return ops;
}

/**
 * Broadcast liquidity operations (Phase 2).
 * Re-fetches fresh pool prices, scales down if DEC is not enough,
 * and broadcasts the add_liquidity ops.
 */
async function broadcastLiquidityPhase(
  username: string,
  dryRunLiqOps: [string, object][],
  sellPct: number,
  poolPct: number
): Promise<{
  txIds: string[];
  warning: string | null;
  error: string | null;
}> {
  // Only check DEC balance when sell% is close to pool%
  const needsDecCheck = sellPct < poolPct + 5;

  const [{ pools: freshPools }, freshDecBalance] = await Promise.all([
    getLandPools(),
    needsDecCheck ? getDecBalance(username) : Promise.resolve(Infinity),
  ]);

  const rawOps = buildFreshLiquidityOps(dryRunLiqOps, freshPools);
  if (rawOps.length === 0) return { txIds: [], warning: null, error: null };

  // Scale down if insufficient DEC
  const totalDecNeeded = rawOps.reduce((sum, op) => sum + op.decAmount, 0);
  let scale = 1;
  let warning: string | null = null;

  if (totalDecNeeded > freshDecBalance && totalDecNeeded > 0) {
    scale = freshDecBalance / totalDecNeeded;
    warning =
      `Not enough DEC for full pool portion. Scaled pool amounts to ${Math.floor(scale * 100)}% ` +
      `(had ${fmt(freshDecBalance)} DEC, needed ~${fmt(totalDecNeeded)} DEC). ` +
      `Tip: adjust your sell/pool split (e.g. sell ${sellPct + 2}% / pool ${poolPct - 2}%).`;
  }

  // Build final ops with scaling applied
  const liquidityOps: [string, object][] = [];
  for (const op of rawOps) {
    const scaledResource = Number.parseFloat(
      (op.resourceAmount * scale).toFixed(3)
    );
    const scaledDec = Number.parseFloat((op.decAmount * scale).toFixed(3));
    if (scaledResource <= 0 || scaledDec <= 0) continue;
    liquidityOps.push(
      buildAddLiquidityOp(
        username,
        op.regionUid,
        op.symbol,
        scaledResource,
        scaledDec
      )
    );
  }

  if (liquidityOps.length === 0) return { txIds: [], warning, error: null };

  const res = await broadcastOperations(username, liquidityOps);
  if (!res.success) {
    return {
      txIds: [],
      warning,
      error: res.error ?? "Broadcast failed (add liquidity phase)",
    };
  }
  await waitForTransactions(res.txIds);
  return { txIds: res.txIds, warning, error: null };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useProcessResourcesAction({
  username,
  visibleRegions,
  postHarvestStrategy,
  excludedResources,
  sellPct,
  poolPct,
  onSuccess,
}: Params): UseProcessResourcesAction {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<BroadcastResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const execute = useCallback(
    async (isDryRun: boolean): Promise<DryRunResult | null> => {
      setBusy(true);
      setResult(null);
      setError(null);
      setWarning(null);
      try {
        // Fetch current state and build ops plan
        const [{ balances }, { pools }] = await Promise.all([
          getBulkRegionData(
            visibleRegions.map((r) => r.region_uid),
            !isDryRun
          ),
          getLandPools(),
        ]);
        const { sellOps, liquidityOps, log, actions } = buildPostHarvestOps(
          visibleRegions,
          username,
          balances,
          pools,
          postHarvestStrategy,
          excludedResources,
          sellPct,
          poolPct
        );

        // Append DEC balance info to log when pool portion may be tight
        if (postHarvestStrategy === "sell_and_pool") {
          await appendDecBalanceInfo(
            log,
            username,
            liquidityOps,
            actions,
            sellPct,
            poolPct
          );
        }

        if (isDryRun) {
          return { title: "Dry Run — Process Resources", log };
        }

        if (sellOps.length === 0 && liquidityOps.length === 0) {
          setError(
            "No resources to process (all below minimum or strategy is accumulate)."
          );
          return null;
        }

        let allTxIds: string[] = [];

        // Phase 1: sell resources for DEC
        if (postHarvestStrategy === "sell_and_pool" && sellPct > 0) {
          const sellResult = await broadcastSellPhase(username, sellOps);
          if ("error" in sellResult) {
            setError(sellResult.error);
            return null;
          }
          allTxIds = sellResult.txIds;
        }

        // Phase 2: add liquidity (sell_and_pool with poolPct > 0)
        if (postHarvestStrategy === "sell_and_pool" && poolPct > 0) {
          const liqResult = await broadcastLiquidityPhase(
            username,
            liquidityOps,
            sellPct,
            poolPct
          );

          if (liqResult.warning) setWarning(liqResult.warning);
          if (liqResult.error) {
            setError(liqResult.error);
            return null;
          }
          allTxIds = [...allTxIds, ...liqResult.txIds];
        }

        // Record results
        await recordPostHarvestLog(username, actions, allTxIds).catch(() => {});
        setResult({ success: true, txIds: allTxIds });
        onSuccess?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setBusy(false);
      }
      return null;
    },
    [
      username,
      visibleRegions,
      postHarvestStrategy,
      excludedResources,
      sellPct,
      poolPct,
      onSuccess,
    ]
  );

  return {
    busy,
    result,
    error,
    warning,
    clearResult: () => setResult(null),
    clearError: () => setError(null),
    clearWarning: () => setWarning(null),
    execute,
  };
}
