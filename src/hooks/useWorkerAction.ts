import {
  getPurchaseAuthorityStatus,
  getRentalAuthorityStatus,
} from "@/lib/backend/actions/land-manager/authority-actions";
import {
  BuyExecutionPlan,
  getBuyExecutionPlan,
} from "@/lib/backend/actions/land-manager/buy-actions";
import {
  recordPurchaseLog,
  recordRentalLog,
} from "@/lib/backend/actions/land-manager/log-actions";
import { getDecBalance } from "@/lib/backend/actions/land-manager/overview-actions";
import { purchaseOnBehalfOf } from "@/lib/backend/actions/land-manager/purchase-broadcast-actions";
import { rentOnBehalfOf } from "@/lib/backend/actions/land-manager/rent-broadcast-actions";
import {
  getRentalExecutionPlan,
  RentalExecutionPlan,
} from "@/lib/backend/actions/land-manager/rental-actions";
import {
  broadcastOperations,
  waitForTransactions,
} from "@/lib/frontend/splBroadcast";
import {
  buildStakeWorkersOp,
  StakeWorkerCard,
} from "@/lib/shared/operations/opBuilders";
import {
  BuyConfig,
  RentalConfig,
  WorkerPlanItem,
  WorkerPlanPick,
  WorkerPlanTotals,
} from "@/types/landManager";
import { useCallback, useState } from "react";

export type WorkerMode = "rent" | "buy";

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
  /** USD value of bought cards. Always 0 for rentals. */
  totalUsd: number;
}

interface BaseParams {
  username: string;
  enabledRegions: number[];
  eligiblePlotCount?: number | null;
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
  clearExecutionPlan: () => void;
  clearResult: () => void;
  clearError: () => void;
  prepareExecution: () => Promise<void>;
  execute: () => Promise<void>;
}

// Per-mode wiring: which plan to fetch, which authority to check, how to
// broadcast phase 1, and how the run is logged. Everything else (balance
// check, staking, verification, result bookkeeping) is shared.
function rentMode(rental: RentalConfig, regions: number[]) {
  return {
    label: "rent",
    notConfiguredError: "Server-side renting is not configured.",
    fetchPlan: () => getRentalExecutionPlan(regions, rental),
    authority: getRentalAuthorityStatus,
    async broadcast(picks: WorkerPlanPick[]) {
      const marketIds = picks.map((p) => p.market_id);
      const res = await rentOnBehalfOf(marketIds);
      return { ...res, verb: "Rent" };
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

function buyMode(buy: BuyConfig, regions: number[]) {
  return {
    label: "buy",
    notConfiguredError: "Server-side buying is not configured.",
    fetchPlan: () => getBuyExecutionPlan(regions, buy),
    authority: getPurchaseAuthorityStatus,
    async broadcast(picks: WorkerPlanPick[]) {
      const items = picks.map((p) => ({
        market_id: p.market_id,
        price_dec: p.total_dec,
      }));
      const res = await purchaseOnBehalfOf(items);
      return { ...res, verb: "Buy" };
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
    enabledRegions,
    eligiblePlotCount = null,
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

  // Resolve the per-mode strategy. Cheap to build; memoised on (mode, config).
  const strategy = useCallback(
    () =>
      mode === "rent"
        ? rentMode(config as RentalConfig, enabledRegions)
        : buyMode(config as BuyConfig, enabledRegions),
    [mode, config, enabledRegions]
  );

  const prepareExecution = useCallback(async () => {
    setBusy(true);
    setError(null);
    setExecutionPlan(null);
    setDecBalance(null);
    try {
      const [plan, balance] = await Promise.all([
        strategy().fetchPlan(),
        username ? getDecBalance(username) : Promise.resolve(0),
      ]);
      setExecutionPlan(plan);
      setDecBalance(balance);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  }, [strategy, username]);

  const execute = useCallback(async () => {
    if (!username) {
      setError("Not logged in.");
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);

    const s = strategy();

    // Re-fetch plan and DEC balance right before broadcast — listings can be
    // claimed by others and balances can move while the confirm dialog is open.
    let exec: WorkerExecPlan;
    let balance: number;
    try {
      [exec, balance] = await Promise.all([
        s.fetchPlan(),
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
    if (balance < totalCost) {
      setError(
        `Insufficient DEC: need ${totalCost.toFixed(3)} but have ${balance.toFixed(3)}. Top up and re-run.`
      );
      setBusy(false);
      return;
    }

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

      const actionResults = await waitForTransactions(actionRes.txIds);

      // Prefer actual DEC/USD from confirmed purchase results; fall back to the
      // plan estimate for DEC. (Rentals have no per-tx USD — totalUsd stays 0.)
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
      const totalUsd = actualUsd;

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
        stakeOps.push(buildStakeWorkersOp(username, item.plot.deed_uid, cards));
      }

      let stakeTxIds: string[] = [];
      if (stakeOps.length > 0) {
        const stakeRes = await broadcastOperations(username, stakeOps);
        stakeTxIds = stakeRes.txIds;
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
            actionRes.txIds,
            stakeTxIds
          ).catch(() => {});
          setError(
            `Cards were ${s.label === "rent" ? "rented" : "bought"} but staking failed: ${stakeRes.error}. You can manually stake them from Splinterlands.`
          );
          setBusy(false);
          return;
        }
        await waitForTransactions(stakeRes.txIds);
      }

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
      setExecutionPlan(null);
      s.record(
        username,
        picks.length,
        stakedCount,
        totalDec,
        totalUsd,
        actionRes.txIds,
        stakeTxIds
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
      setBusy(false);
    }
  }, [username, strategy, mode, onSuccess]);

  return {
    busy,
    eligiblePlotCount,
    executionPlan,
    decBalance,
    result,
    error,
    clearExecutionPlan: () => {
      setExecutionPlan(null);
      setDecBalance(null);
    },
    clearResult: () => setResult(null),
    clearError: () => setError(null),
    prepareExecution,
    execute,
  };
}
