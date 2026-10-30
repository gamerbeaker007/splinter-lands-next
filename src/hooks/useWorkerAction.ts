import {
  recordPurchaseLog,
  recordRentalLog,
} from "@/lib/backend/actions/land-manager/log-actions";
import { purchaseOnBehalfOf } from "@/lib/backend/actions/land-manager/purchase-broadcast-actions";
import { rentOnBehalfOf } from "@/lib/backend/actions/land-manager/rent-broadcast-actions";
import { invalidatePlayerBrowserCaches } from "@/lib/frontend/browser-cache";
import { getAuthorityStatus, getDecBalance } from "@/lib/frontend/land-data";
import {
  getBuyExecutionPlan,
  getRentalExecutionPlan,
} from "@/lib/frontend/land-production-data";
import {
  broadcastOperations,
  waitForTransactions,
} from "@/lib/frontend/splBroadcast";
import {
  buildStakeWorkersOp,
  StakeWorkerCard,
} from "@/lib/shared/operations/opBuilders";
import type {
  BuyExecutionPlan,
  RentalExecutionPlan,
} from "@/lib/shared/workerPlan";
import {
  BuyConfig,
  RentalConfig,
  WorkerPlanItem,
  WorkerPlanPick,
  WorkerPlanTotals,
} from "@/types/landManager";
import { useCallback, useState } from "react";

export type WorkerMode = "rent" | "buy";

// The refreshed plan may cost a little more than the one shown (prices move);
// beyond this the user has to look at the new plan and confirm again.
const PLAN_COST_TOLERANCE = 0.02;

function configKey(config: RentalConfig | BuyConfig): string {
  return JSON.stringify(config);
}

/** Minimal execution-plan shape the shared flow needs (both modes satisfy it). */
interface WorkerExecPlan {
  plan: { items: WorkerPlanItem[]; totals: WorkerPlanTotals };
  emptySlotsByDeed: Record<string, number[]>;
}

export interface WorkerExecuteResult {
  success: boolean;
  mode: WorkerMode;
  /** Rent or purchase tx ids (phase 1). */
  actionTxIds: string[];
  /** Stake tx ids (phase 2). */
  stakeTxIds: string[];
  /** Cards rented or bought. */
  count: number;
  stakedCount: number;
  totalDec: number;
  /** USD value: actual for buys, the planned estimate for rentals. */
  totalUsd: number;
}

interface BaseParams {
  username: string;
  eligiblePlotCount?: number | null;
  /** When set, restricts planning to only these deed UIDs (filtered Production plots). */
  filteredDeedUids?: string[];
  onSuccess?: () => void;
}
interface RentParams extends BaseParams {
  mode: "rent";
  rental: RentalConfig;
}
interface BuyParams extends BaseParams {
  mode: "buy";
  buy: BuyConfig;
}
type WorkerActionParams = RentParams | BuyParams;

export interface UseWorkerAction<P extends WorkerExecPlan = WorkerExecPlan> {
  busy: boolean;
  eligiblePlotCount: number | null;
  executionPlan: P | null;
  /** Player DEC balance fetched alongside the execution plan. */
  decBalance: number | null;
  result: WorkerExecuteResult | null;
  error: string | null;
  /**
   * The shown plan may no longer be confirmed: a run already acquired some of
   * its cards, or the settings changed since the search. Search again first.
   */
  isPlanConfirmable: (config: RentalConfig | BuyConfig) => boolean;
  clearExecutionPlan: () => void;
  clearResult: () => void;
  clearError: () => void;
  prepareExecution: (
    configOverride?: RentalConfig | BuyConfig
  ) => Promise<void>;
  execute: (configOverride?: RentalConfig | BuyConfig) => Promise<void>;
}

// Per-mode wiring: which plan to fetch, which authority to check, how to
// broadcast phase 1, and how the run is logged. Everything else (balance
// check, staking, verification, result bookkeeping) is shared.
function rentMode(rental: RentalConfig, filteredDeedUids?: string[]) {
  return {
    label: "rent",
    notConfiguredError: "Server-side renting is not configured.",
    fetchPlan: (fresh = false) =>
      getRentalExecutionPlan(rental, filteredDeedUids, fresh),
    authority: () => getAuthorityStatus("rental"),
    async broadcast(picks: WorkerPlanPick[]) {
      const marketIds = picks.map((p) => p.market_id);
      const res = await rentOnBehalfOf(marketIds);
      return { ...res, verb: "Rent", pollIds: res.opTxIds ?? res.txIds };
    },
    record: (
      player: string,
      count: number,
      stakedCount: number,
      totalDec: number,
      _totalUsd: number,
      actionTxIds: string[],
      stakeTxIds: string[]
    ) =>
      recordRentalLog({
        player,
        rentedCount: count,
        stakedCount,
        totalDec,
        rentTxIds: actionTxIds,
        stakeTxIds,
      }),
  };
}

function buyMode(buy: BuyConfig, filteredDeedUids?: string[]) {
  return {
    label: "buy",
    notConfiguredError: "Server-side buying is not configured.",
    fetchPlan: (fresh = false) =>
      getBuyExecutionPlan(buy, filteredDeedUids, fresh),
    authority: () => getAuthorityStatus("purchase"),
    async broadcast(picks: WorkerPlanPick[]) {
      const items = picks.map((p) => ({
        market_id: p.market_id,
        price_dec: p.total_dec,
      }));
      const res = await purchaseOnBehalfOf(items);
      // Every op is polled: the purchase results carry the actual DEC/USD.
      return { ...res, verb: "Buy", pollIds: res.opTxIds ?? res.txIds };
    },
    record: (
      player: string,
      count: number,
      stakedCount: number,
      totalDec: number,
      totalUsd: number,
      actionTxIds: string[],
      stakeTxIds: string[]
    ) =>
      recordPurchaseLog({
        player,
        boughtCount: count,
        stakedCount,
        totalDec,
        totalUsd,
        purchaseTxIds: actionTxIds,
        stakeTxIds,
      }),
  };
}

export function useWorkerAction(
  params: RentParams
): UseWorkerAction<RentalExecutionPlan>;
export function useWorkerAction(
  params: BuyParams
): UseWorkerAction<BuyExecutionPlan>;
export function useWorkerAction(params: WorkerActionParams): UseWorkerAction {
  const {
    username,
    eligiblePlotCount = null,
    filteredDeedUids,
    onSuccess,
  } = params;
  const mode = params.mode;
  const config = params.mode === "rent" ? params.rental : params.buy;

  const [busy, setBusy] = useState(false);
  const [executionPlan, setExecutionPlan] = useState<WorkerExecPlan | null>(
    null
  );
  const [decBalance, setDecBalance] = useState<number | null>(null);
  const [result, setResult] = useState<WorkerExecuteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Config the shown plan was searched with; null once a run consumed it.
  const [planConfigKey, setPlanConfigKey] = useState<string | null>(null);

  // Resolve the per-mode strategy. Cheap to build; memoised on (mode, config).
  const strategy = useCallback(
    (configOverride?: RentalConfig | BuyConfig) =>
      mode === "rent"
        ? rentMode(
            (configOverride as RentalConfig | undefined) ??
              (config as RentalConfig),
            filteredDeedUids
          )
        : buyMode(
            (configOverride as BuyConfig | undefined) ?? (config as BuyConfig),
            filteredDeedUids
          ),
    [mode, config, filteredDeedUids]
  );

  const prepareExecution = useCallback(
    async (configOverride?: RentalConfig | BuyConfig) => {
      setBusy(true);
      setError(null);
      setExecutionPlan(null);
      setDecBalance(null);
      setPlanConfigKey(null);
      try {
        const [plan, balance] = await Promise.all([
          strategy(configOverride).fetchPlan(),
          username ? getDecBalance(username) : Promise.resolve(0),
        ]);
        setExecutionPlan(plan);
        setDecBalance(balance);
        setPlanConfigKey(configKey(configOverride ?? config));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setBusy(false);
      }
    },
    [strategy, username, config]
  );

  const execute = useCallback(
    async (configOverride?: RentalConfig | BuyConfig) => {
      if (!username) {
        setError("Not logged in.");
        return;
      }
      // Only ever run the plan the user looked at: edited settings or a run
      // that already acquired cards need a new search first.
      if (
        !executionPlan ||
        planConfigKey !== configKey(configOverride ?? config)
      ) {
        setError("Search again before confirming.");
        return;
      }
      const shownTotals = executionPlan.plan.totals;
      setBusy(true);
      setError(null);
      setResult(null);

      const s = strategy(configOverride);

      // Re-fetch plan and DEC balance right before broadcast — listings can be
      // claimed by others and balances can move while the confirm dialog is open.
      let exec: WorkerExecPlan;
      let balance: number;
      try {
        [exec, balance] = await Promise.all([
          s.fetchPlan(true),
          getDecBalance(username),
        ]);
      } catch (err) {
        setError(
          err instanceof Error
            ? `Refresh failed: ${err.message}`
            : "Failed to refresh plan before execute."
        );
        setBusy(false);
        return;
      }
      setExecutionPlan(exec);
      setDecBalance(balance);

      const picks = exec.plan.items.flatMap((item) => item.picks);
      if (picks.length === 0) {
        setError(
          `Nothing left to ${s.label} after re-checking the market — listings may have been claimed.`
        );
        setBusy(false);
        return;
      }

      const totalCost = exec.plan.totals.total_dec;
      if (
        totalCost > shownTotals.total_dec * (1 + PLAN_COST_TOLERANCE) ||
        picks.length > shownTotals.slots_filled
      ) {
        setError(
          `The market moved: the refreshed plan costs ${totalCost.toFixed(3)} DEC for ${picks.length} workers (was ${shownTotals.total_dec.toFixed(3)} DEC). Review it and confirm again.`
        );
        setBusy(false);
        return;
      }
      if (balance < totalCost) {
        setError(
          `Insufficient DEC: need ${totalCost.toFixed(3)} but have ${balance.toFixed(3)}. Top up and re-run.`
        );
        setBusy(false);
        return;
      }

      let broadcastAttempted = false;
      let completed = false;
      try {
        // ── Phase 1: rent/buy (server-signed, no Keychain popup) ──
        const authority = await s.authority();
        if (!authority.serviceConfigured) {
          setError(s.notConfiguredError);
          setBusy(false);
          return;
        }
        if (!authority.authorized) {
          setError(
            `@${authority.serviceAccount} does not have ${s.label === "rent" ? "rental" : "purchase"} authority for @${authority.player}.`
          );
          setBusy(false);
          return;
        }

        broadcastAttempted = true;
        const actionRes = await s.broadcast(picks);
        if (!actionRes.success) {
          setError(
            `${actionRes.verb} failed: ${actionRes.error ?? "unknown error"}.${
              actionRes.txIds.length > 0
                ? " Some chunks may have already broadcast — check your wallet."
                : ""
            }`
          );
          setBusy(false);
          return;
        }

        const actionResults = await waitForTransactions(actionRes.pollIds);

        // Prefer actual DEC/USD from confirmed purchase results; fall back to the
        // plan estimate (rentals have no per-tx result).
        let actualDec = 0;
        let actualUsd = 0;
        let sawResult = false;
        for (const r of actionResults) {
          if (r?.op === "market_purchase") {
            actualDec += r.result.total_dec;
            actualUsd += r.result.total_usd;
            sawResult = true;
          }
        }
        const totalDec = sawResult ? actualDec : totalCost;
        const totalUsd = sawResult
          ? actualUsd
          : picks.reduce((sum, pick) => sum + pick.total_usd, 0);

        // ── Phase 2: stake the acquired cards as workers (posting key) ──
        const stakeOps: [string, object][] = [];
        let skippedDeeds = 0;
        for (const item of exec.plan.items) {
          if (item.picks.length === 0) continue;
          const emptySlots = exec.emptySlotsByDeed[item.plot.deed_uid] ?? [];
          if (emptySlots.length < item.picks.length) {
            skippedDeeds += 1;
            continue;
          }
          const cards: StakeWorkerCard[] = item.picks.map((pick, i) => ({
            card_uid: pick.card_uid,
            slot: emptySlots[i],
          }));
          stakeOps.push(
            buildStakeWorkersOp(username, item.plot.deed_uid, cards)
          );
        }

        // Hive ids for the result card; SPL op ids for the day log.
        const actionOpTxIds = actionRes.opTxIds ?? actionRes.txIds;
        let stakeTxIds: string[] = [];
        let stakeOpTxIds: string[] = [];
        if (stakeOps.length > 0) {
          const stakeRes = await broadcastOperations(username, stakeOps);
          stakeTxIds = stakeRes.txIds;
          stakeOpTxIds = stakeRes.opTxIds;
          if (!stakeRes.success) {
            setResult({
              success: false,
              mode,
              actionTxIds: actionRes.txIds,
              stakeTxIds,
              count: picks.length,
              stakedCount: 0,
              totalDec,
              totalUsd,
            });
            s.record(
              username,
              picks.length,
              0,
              totalDec,
              totalUsd,
              actionOpTxIds,
              stakeOpTxIds
            ).catch(() => {});
            setError(
              `Cards were ${s.label === "rent" ? "rented" : "bought"} but staking failed: ${stakeRes.error}. You can manually stake them from Splinterlands.`
            );
            setBusy(false);
            return;
          }
          await waitForTransactions(stakeRes.opTxIds);
        }

        invalidatePlayerBrowserCaches(username);

        const stakedCount = exec.plan.items
          .filter(
            (item) =>
              item.picks.length > 0 &&
              (exec.emptySlotsByDeed[item.plot.deed_uid]?.length ?? 0) >=
                item.picks.length
          )
          .reduce((sum, item) => sum + item.picks.length, 0);

        setResult({
          success: true,
          mode,
          actionTxIds: actionRes.txIds,
          stakeTxIds,
          count: picks.length,
          stakedCount,
          totalDec,
          totalUsd,
        });
        completed = true;
        setExecutionPlan(null);
        s.record(
          username,
          picks.length,
          stakedCount,
          totalDec,
          totalUsd,
          actionOpTxIds,
          stakeOpTxIds
        ).catch(() => {});
        if (skippedDeeds > 0) {
          setError(
            `${skippedDeeds} plot${skippedDeeds === 1 ? "" : "s"} skipped during staking (slot count mismatch). Stake remaining cards manually.`
          );
        }
        onSuccess?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        // Cards may have been acquired even when the run failed: drop stale
        // reads and never let the same plan be confirmed twice.
        if (broadcastAttempted && !completed) {
          invalidatePlayerBrowserCaches(username);
          setPlanConfigKey(null);
        }
        setBusy(false);
      }
    },
    [username, strategy, mode, onSuccess, executionPlan, planConfigKey, config]
  );

  return {
    busy,
    eligiblePlotCount,
    executionPlan,
    decBalance,
    result,
    error,
    isPlanConfirmable: (cfg) =>
      executionPlan != null && planConfigKey === configKey(cfg),
    clearExecutionPlan: () => {
      setExecutionPlan(null);
      setDecBalance(null);
      setPlanConfigKey(null);
    },
    clearResult: () => setResult(null),
    clearError: () => setError(null),
    prepareExecution,
    execute,
  };
}
