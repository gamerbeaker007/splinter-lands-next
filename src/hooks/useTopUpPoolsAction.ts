"use client";

import { recordPostHarvestLog } from "@/lib/backend/actions/land-manager/log-actions";
import {
  getBulkRegionData,
  getDecBalance,
  getLandPools,
  invalidatePlayerRegionCaches,
} from "@/lib/backend/actions/land-manager/overview-actions";
import {
  BroadcastResult,
  broadcastOperations,
  waitForTransactions,
} from "@/lib/frontend/splBroadcast";
import {
  buildDepositOps,
  buildFundingOps,
  buildTopUpPoolPlan,
} from "@/lib/frontend/topUpPoolOps";
import {
  HOURS_PER_WEEK,
  computeRegionResourceBalance,
  computeWeeklyPoolNeed,
} from "@/lib/shared/poolPositionUtils";
import {
  ActionPlan,
  PostHarvestActionSummary,
  TopUpPoolPlan,
  TopUpPoolStrategy,
} from "@/types/landManager";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
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
// Phase 2 re-reads pool prices, the DEC balance AND the per-region resource
// balances, so the deposit is sized against reality rather than the pre-sale
// projection. The resource re-read matters because the funding swap is
// broadcast with SWAP_MAX_SLIPPAGE tolerance: it can settle successfully while
// delivering less than the quote the plan was built on. If refreshed balances
// invalidate part of the plan, that part is dropped and reported rather than
// broadcast against stale numbers.
// ─────────────────────────────────────────────────────────────────────────────

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
        let fundingSettled = false;
        if (funding.ops.length > 0) {
          const res = await broadcastOperations(username, funding.ops);
          if (!res.success) {
            setError(res.error ?? "Broadcast failed (sell/buy phase)");
            return null;
          }
          await waitForTransactions(res.txIds);
          fundingSettled = true;
          allTxIds = res.txIds;
          allActions.push(...funding.actions);
        }

        // Phase 2 — deposit, sized against post-settlement reality.
        //
        // The region read is forced ONLY when phase 1 actually broadcast:
        // invalidatePlayerRegionCaches() runs at the very end of this function,
        // so a cached read here would still hold pre-swap balances. When no
        // funding ran, nothing has moved since the plan was built and the
        // cached read is both correct and one fewer SPL call. Reviewing a plan
        // (`planOnly`) returns before this point, so it never refreshes at all.
        const depositRegionUids = [
          ...new Set(
            plan.resources
              .filter((r) => r.status === "READY")
              .flatMap((r) => r.additions.map((a) => a.region_uid))
          ),
        ];
        const [{ pools: freshPools }, freshDec, regionData] = await Promise.all(
          [
            getLandPools(),
            getDecBalance(username),
            depositRegionUids.length > 0
              ? getBulkRegionData(depositRegionUids, fundingSettled)
              : Promise.resolve(null),
          ]
        );
        const freshBalances =
          regionData && !regionData.error ? regionData.balances : null;
        const deposits = buildDepositOps(
          username,
          plan,
          freshPools,
          freshDec,
          freshBalances
        );
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
