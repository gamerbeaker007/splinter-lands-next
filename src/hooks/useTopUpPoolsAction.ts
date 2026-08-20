"use client";

import { recordPostHarvestLog } from "@/lib/backend/actions/land-manager/log-actions";
import {
  getBulkRegionData,
  getDecBalance,
  getLandPools,
  invalidatePlayerRegionCaches,
} from "@/lib/backend/actions/land-manager/overview-actions";
import { buildTopUpPoolPlan } from "@/lib/frontend/topUpPoolOps";
import {
  BroadcastResult,
  broadcastOperations,
  waitForTransactions,
} from "@/lib/frontend/splBroadcast";
import {
  HOURS_PER_WEEK,
  computeRegionResourceBalance,
  computeWeeklyPoolNeed,
} from "@/lib/shared/poolPositionUtils";
import {
  buildAddLiquidityOp,
  buildBuyWithDecOp,
  buildSellResourceForDecOp,
  buildSwapTokensOp,
} from "@/lib/shared/operations/opBuilders";
import {
  ActionPlan,
  PostHarvestActionSummary,
  TopUpPoolPlan,
  TopUpPoolStrategy,
} from "@/types/landManager";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import { SplLandPool } from "@/types/spl/landPools";
import { useCallback, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Top Up Pools execution
//
// Ordering matters: a pool deposit must not be submitted before the resource
// sale/purchase/swap that funds it has actually settled, or the deposit can fail
// for want of DEC (or resource) that only exists on paper.
//
//   SELL / BUY / SWAP  →  wait + validate  →  ADD RESOURCE + DEC TO POOL
//
// Phase 2 re-reads pool prices and the DEC balance, so the deposit is priced
// against reality rather than the pre-sale projection. If refreshed balances
// invalidate part of the plan, that part is dropped and reported rather than
// broadcast against stale numbers.
// ─────────────────────────────────────────────────────────────────────────────

const round3 = (n: number): number => Number.parseFloat(n.toFixed(3));
const fmt = (n: number): string =>
  n.toLocaleString(undefined, { maximumFractionDigits: 2 });

/** Relaxed slippage: same tolerance the post-harvest sell flow uses. */
const SWAP_MAX_SLIPPAGE = 50;

interface Params {
  username: string;
  visibleRegions: SplProductionOverviewRegion[];
  strategies: TopUpPoolStrategy[];
  onSuccess?: () => void;
}

interface UseTopUpPoolsAction {
  busy: boolean;
  result: BroadcastResult | null;
  error: string | null;
  warning: string | null;
  clearResult: () => void;
  clearError: () => void;
  clearWarning: () => void;
  execute: (planOnly: boolean) => Promise<ActionPlan | null>;
}

/** Fetch everything the planner needs and produce the plan. */
async function planTopUp(
  username: string,
  visibleRegions: SplProductionOverviewRegion[],
  strategies: TopUpPoolStrategy[],
  force: boolean
): Promise<TopUpPoolPlan> {
  const [{ harvestable, balances, overviews }, { pools }, decBalance] =
    await Promise.all([
      getBulkRegionData(
        visibleRegions.map((r) => r.region_uid),
        force
      ),
      getLandPools(),
      getDecBalance(username),
    ]);

  // Rate-based, so it stays valid immediately after a harvest — which is exactly
  // when this action runs (Make Harvestable → Harvest → Top Up Pools). Netted per
  // region: only what a region cannot produce itself has to be deposited for it.
  const regionBalances = Object.fromEntries(
    visibleRegions.map((r) => [
      r.region_uid,
      computeRegionResourceBalance(r, overviews[r.region_uid] ?? null),
    ])
  );
  const need = computeWeeklyPoolNeed(
    visibleRegions,
    regionBalances,
    HOURS_PER_WEEK,
    harvestable
  );

  return buildTopUpPoolPlan({
    regions: visibleRegions,
    balances,
    pools,
    decBalance,
    strategies,
    weeklyExternalNeed: need.perResource,
    weeklyConsumption: Object.fromEntries(
      Object.entries(need.consumedPerHour).map(([symbol, rate]) => [
        symbol,
        rate * HOURS_PER_WEEK,
      ])
    ),
    hourlyRates: {
      consumed: need.consumedPerHour,
      produced: need.producedPerHour,
      externalNeed: need.externalNeedPerHour,
    },
    consumptionWarnings: need.warnings,
  });
}

/** Phase 1 ops: the sales and purchases that fund the deposits. */
function buildFundingOps(
  username: string,
  plan: TopUpPoolPlan
): { ops: [string, object][]; actions: PostHarvestActionSummary[] } {
  const ops: [string, object][] = [];
  const actions: PostHarvestActionSummary[] = [];

  for (const r of plan.resources) {
    if (r.status !== "READY") continue;

    for (const step of r.funding) {
      if (step.kind === "sell") {
        // `from_symbol`, not `r.symbol`: the swap strategy funds its DEC side by
        // selling the DONOR resource.
        ops.push(
          buildSellResourceForDecOp(
            username,
            step.region_uid,
            step.amount,
            step.dec_out,
            step.from_symbol,
            SWAP_MAX_SLIPPAGE
          )
        );
        actions.push({
          type: "sell_for_dec",
          region_uid: step.region_uid,
          symbol: step.from_symbol,
          resource_in: step.amount,
          dec_amount: step.dec_out,
        });
      } else if (step.kind === "buy") {
        ops.push(
          buildBuyWithDecOp(
            username,
            step.region_uid,
            step.dec_in,
            step.resource_out,
            r.symbol,
            SWAP_MAX_SLIPPAGE
          )
        );
        actions.push({
          type: "buy_resource",
          region_uid: step.region_uid,
          symbol: r.symbol,
          resource_in: step.resource_out,
          dec_amount: step.dec_in,
        });
      } else {
        // Resource → DEC → resource in one op, so the swapped resource lands in
        // the same region it left and the deposit can be made there.
        ops.push(
          buildSwapTokensOp({
            username,
            fromRegionUid: step.region_uid,
            toRegionUid: step.region_uid,
            fromSymbol: step.from_symbol,
            toSymbol: r.symbol,
            inAmount: step.in_amount,
            outAmount1: step.dec_out,
            outAmount2: step.resource_out,
            maxSlippage: SWAP_MAX_SLIPPAGE,
          })
        );
        actions.push({
          type: "swap_resource",
          region_uid: step.region_uid,
          symbol: step.from_symbol,
          resource_in: step.in_amount,
          dec_amount: step.dec_out,
          to_symbol: r.symbol,
          resource_out: step.resource_out,
        });
      }
    }
  }

  return { ops, actions };
}

/**
 * Phase 2 ops: re-price the planned deposits against fresh pool ratios and the
 * DEC actually in the wallet now. Deposits that no longer fit are dropped whole
 * (never half-funded) and reported back as a warning.
 */
function buildDepositOps(
  username: string,
  plan: TopUpPoolPlan,
  freshPools: SplLandPool[],
  freshDec: number
): {
  ops: [string, object][];
  actions: PostHarvestActionSummary[];
  dropped: string[];
} {
  const poolMap = new Map(
    freshPools.map((p) => [
      p.token_symbol,
      {
        decQty: Number.parseFloat(p.dec_quantity),
        resourceQty: Number.parseFloat(p.resource_quantity),
      },
    ])
  );

  const ops: [string, object][] = [];
  const actions: PostHarvestActionSummary[] = [];
  const dropped: string[] = [];
  let decLeft = freshDec;

  for (const r of plan.resources) {
    if (r.status !== "READY") continue;

    const pool = poolMap.get(r.symbol);
    if (!pool || pool.resourceQty <= 0) {
      dropped.push(`${r.symbol}: pool data unavailable at broadcast time`);
      continue;
    }
    const ratio = pool.decQty / pool.resourceQty;

    const legs = r.additions.map((a) => ({
      ...a,
      dec_amount: round3(a.resource_amount * ratio),
    }));
    const decNeeded = legs.reduce((s, a) => s + a.dec_amount, 0);

    if (decNeeded > decLeft) {
      dropped.push(
        `${r.symbol}: needs ${fmt(decNeeded)} DEC at current prices but only ${fmt(decLeft)} DEC is left — skipped rather than partially deposited`
      );
      continue;
    }

    for (const leg of legs) {
      if (leg.resource_amount <= 0 || leg.dec_amount <= 0) continue;
      ops.push(
        buildAddLiquidityOp(
          username,
          leg.region_uid,
          r.symbol,
          leg.resource_amount,
          leg.dec_amount
        )
      );
      actions.push({
        type: "add_to_pool",
        region_uid: leg.region_uid,
        symbol: r.symbol,
        resource_in: leg.resource_amount,
        dec_amount: leg.dec_amount,
      });
    }
    decLeft -= decNeeded;
  }

  return { ops, actions, dropped };
}

export function useTopUpPoolsAction({
  username,
  visibleRegions,
  strategies,
  onSuccess,
}: Params): UseTopUpPoolsAction {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<BroadcastResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const execute = useCallback(
    async (planOnly: boolean): Promise<ActionPlan | null> => {
      setBusy(true);
      setResult(null);
      setError(null);
      setWarning(null);
      try {
        const plan = await planTopUp(
          username,
          visibleRegions,
          strategies,
          !planOnly
        );

        if (planOnly) {
          return { title: "Review plan — Top Up Pools", log: plan.log };
        }

        const ready = plan.resources.filter((r) => r.status === "READY");
        if (ready.length === 0) {
          setError(
            "Nothing to top up — no resource could be fully funded by the enabled strategies. The plan lists why each one was skipped."
          );
          return null;
        }

        let allTxIds: string[] = [];
        const allActions: PostHarvestActionSummary[] = [];

        // Phase 1 — sell / buy, then wait for settlement.
        const funding = buildFundingOps(username, plan);
        if (funding.ops.length > 0) {
          const res = await broadcastOperations(username, funding.ops);
          if (!res.success) {
            setError(res.error ?? "Broadcast failed (sell/buy phase)");
            return null;
          }
          await waitForTransactions(res.txIds);
          allTxIds = res.txIds;
          allActions.push(...funding.actions);
        }

        // Phase 2 — deposit, priced against post-settlement reality.
        const [{ pools: freshPools }, freshDec] = await Promise.all([
          getLandPools(),
          getDecBalance(username),
        ]);
        const deposits = buildDepositOps(username, plan, freshPools, freshDec);
        if (deposits.dropped.length > 0) {
          setWarning(
            `Some pool additions were skipped: ${deposits.dropped.join(" · ")}`
          );
        }

        if (deposits.ops.length > 0) {
          const res = await broadcastOperations(username, deposits.ops);
          if (!res.success) {
            setError(res.error ?? "Broadcast failed (add liquidity phase)");
            // Phase 1 already settled — record it so the funding isn't lost
            // from the log even though the deposit failed.
            await recordPostHarvestLog(username, allActions, allTxIds).catch(
              () => {}
            );
            return null;
          }
          await waitForTransactions(res.txIds);
          allTxIds = [...allTxIds, ...res.txIds];
          allActions.push(...deposits.actions);
        }

        await recordPostHarvestLog(username, allActions, allTxIds).catch(
          () => {}
        );
        setResult({ success: true, txIds: allTxIds });
        // Clear the cached pre-action snapshot so the refresh below reads
        // post-action balances rather than winning a cache hit on stale data.
        await invalidatePlayerRegionCaches().catch(() => {});
        onSuccess?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setBusy(false);
      }
      return null;
    },
    [username, visibleRegions, strategies, onSuccess]
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
