import { getRentalAuthorityStatus } from "@/lib/backend/actions/land-manager/authority-actions";
import { recordRentalLog } from "@/lib/backend/actions/land-manager/log-actions";
import {
  getDecBalance,
  lookupTransaction,
} from "@/lib/backend/actions/land-manager/overview-actions";
import { rentOnBehalfOf } from "@/lib/backend/actions/land-manager/rent-broadcast-actions";
import {
  getRentalDryRunPlan,
  getRentalEligibility,
  getRentalExecutionPlan,
  RentalExecutionPlan,
} from "@/lib/backend/actions/land-manager/rental-actions";
import {
  buildStakeWorkersOp,
  StakeWorkerCard,
} from "@/lib/frontend/opBuilders";
import {
  broadcastOperations,
  waitForTransactions,
} from "@/lib/frontend/splBroadcast";
import { RentalConfig, RentalPlan } from "@/types/landManager";
import { useCallback, useEffect, useState } from "react";

interface Params {
  username: string;
  rental: RentalConfig;
  enabledRegions: number[];
  onSuccess?: () => void;
}

export interface RentExecuteResult {
  success: boolean;
  rentTxIds: string[];
  stakeTxIds: string[];
  rentedCount: number;
  stakedCount: number;
  totalDec: number;
}

export interface UseRentEmptyWorkersAction {
  busy: boolean;
  eligiblePlotCount: number | null;
  dryRunPlan: RentalPlan | null;
  executionPlan: RentalExecutionPlan | null;
  result: RentExecuteResult | null;
  error: string | null;
  clearDryRunPlan: () => void;
  clearExecutionPlan: () => void;
  clearResult: () => void;
  clearError: () => void;
  preview: () => Promise<void>;
  prepareExecution: () => Promise<void>;
  execute: () => Promise<void>;
}

export function useRentEmptyWorkersAction({
  username,
  rental,
  enabledRegions,
  onSuccess,
}: Params): UseRentEmptyWorkersAction {
  const [busy, setBusy] = useState(false);
  const [eligiblePlotCount, setEligiblePlotCount] = useState<number | null>(
    null
  );
  const [checkKey, setCheckKey] = useState(0);
  const [dryRunPlan, setDryRunPlan] = useState<RentalPlan | null>(null);
  const [executionPlan, setExecutionPlan] =
    useState<RentalExecutionPlan | null>(null);
  const [result, setResult] = useState<RentExecuteResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getRentalEligibility(enabledRegions)
      .then(({ eligible }) => {
        if (!cancelled) setEligiblePlotCount(eligible.length);
      })
      .catch(() => {
        if (!cancelled) setEligiblePlotCount(null);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabledRegions.join(","), checkKey]);

  const preview = useCallback(async () => {
    setBusy(true);
    setError(null);
    setDryRunPlan(null);
    try {
      const plan = await getRentalDryRunPlan(enabledRegions, rental);
      setDryRunPlan(plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  }, [enabledRegions, rental]);

  const prepareExecution = useCallback(async () => {
    setBusy(true);
    setError(null);
    setExecutionPlan(null);
    try {
      const plan = await getRentalExecutionPlan(enabledRegions, rental);
      setExecutionPlan(plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  }, [enabledRegions, rental]);

  const execute = useCallback(async () => {
    if (!username) {
      setError("Not logged in.");
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);

    // Re-fetch plan and DEC balance right before broadcast. The user may have
    // sat on the confirm dialog for a while — listings can be rented by
    // others and DEC balances can move in the meantime. The freshly-fetched
    // plan replaces what the dialog showed.
    let exec: RentalExecutionPlan;
    let decBalance: number;
    try {
      [exec, decBalance] = await Promise.all([
        getRentalExecutionPlan(enabledRegions, rental),
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
    // Keep the on-screen confirm/dialog state in sync with what we'll
    // actually broadcast.
    setExecutionPlan(exec);

    const allMarketIds: string[] = [];
    for (const item of exec.plan.items) {
      for (const pick of item.picks) allMarketIds.push(pick.market_id);
    }
    if (allMarketIds.length === 0) {
      setError(
        "Nothing left to rent after re-checking the market — listings may have been claimed."
      );
      setBusy(false);
      return;
    }

    const totalCost = exec.plan.totals.total_dec;
    if (decBalance < totalCost) {
      setError(
        `Insufficient DEC: need ${totalCost.toFixed(3)} but have ${decBalance.toFixed(3)}. Top up and re-run.`
      );
      setBusy(false);
      return;
    }

    try {
      // ── Phase 1: rent (server-signed, no Keychain popup) ──
      // Renting is server-side only — the configured land-service account
      // signs sm_market_rent on the player's behalf via granted rental
      // authority. The UI blocks this code path when authority is missing.
      const authority = await getRentalAuthorityStatus();
      if (!authority.serviceConfigured) {
        setError("Server-side renting is not configured.");
        setBusy(false);
        return;
      }
      if (!authority.authorized) {
        setError(
          `@${authority.serviceAccount} does not have rental authority for @${authority.player}.`
        );
        setBusy(false);
        return;
      }

      const rentRes = await rentOnBehalfOf(allMarketIds);
      if (!rentRes.success) {
        setError(
          `Rent failed: ${rentRes.error ?? "unknown error"}.${
            rentRes.txIds.length > 0
              ? " Some chunks may have already broadcast — check your wallet."
              : ""
          }`
        );
        setBusy(false);
        return;
      }

      await waitForTransactions(rentRes.txIds, lookupTransaction);

      // ── Phase 2: stake (posting key) ──
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
            rentTxIds: rentRes.txIds,
            stakeTxIds,
            rentedCount: allMarketIds.length,
            stakedCount: 0,
            totalDec: exec.plan.totals.total_dec,
          });
          setError(
            `Cards were rented but staking failed: ${stakeRes.error}. You can manually stake them from Splinterlands.`
          );
          setBusy(false);
          return;
        }
        await waitForTransactions(stakeRes.txIds, lookupTransaction);
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
        rentTxIds: rentRes.txIds,
        stakeTxIds,
        rentedCount: allMarketIds.length,
        stakedCount,
        totalDec: exec.plan.totals.total_dec,
      });
      setExecutionPlan(null);
      recordRentalLog({
        player: username,
        rentedCount: allMarketIds.length,
        stakedCount,
        totalDec: exec.plan.totals.total_dec,
        rentTxIds: rentRes.txIds,
        stakeTxIds,
      }).catch(() => {});
      if (skippedDeeds > 0) {
        setError(
          `${skippedDeeds} plot${skippedDeeds === 1 ? "" : "s"} skipped during staking (slot count mismatch). Stake remaining cards manually.`
        );
      }
      onSuccess?.();
      setCheckKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  }, [username, enabledRegions, rental, onSuccess]);

  return {
    busy,
    eligiblePlotCount,
    dryRunPlan,
    executionPlan,
    result,
    error,
    clearDryRunPlan: () => setDryRunPlan(null),
    clearExecutionPlan: () => setExecutionPlan(null),
    clearResult: () => setResult(null),
    clearError: () => setError(null),
    preview,
    prepareExecution,
    execute,
  };
}
