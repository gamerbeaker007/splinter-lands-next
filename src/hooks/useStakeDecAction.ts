"use client";

import {
  getDecBalance,
  lookupTransaction,
} from "@/lib/backend/actions/land-manager/overview-actions";
import {
  getStakeDecPlan,
  recordStakeDecLog,
  StakeDecPlan,
} from "@/lib/backend/actions/land-manager/stake-dec-actions";
import { buildStakeDecRegionOp } from "@/lib/shared/operations/opBuilders";
import {
  broadcastOperations,
  KeychainKeyTypes,
  waitForTransactions,
} from "@/lib/frontend/splBroadcast";
import { useCallback, useState } from "react";

interface Params {
  username: string;
  enabledRegions: number[];
  onSuccess?: () => void;
}

export interface StakeDecExecuteResult {
  success: boolean;
  txIds: string[];
  succeededByRegion: Record<string, number>;
  failedByRegion: Record<string, number>;
  totalSucceeded: number;
  totalFailed: number;
}

export interface UseStakeDecAction {
  busy: boolean;
  dryRun: StakeDecPlan | null;
  decBalance: number | null;
  result: StakeDecExecuteResult | null;
  error: string | null;
  clearDryRun: () => void;
  clearResult: () => void;
  clearError: () => void;
  preview: () => Promise<void>;
  execute: () => Promise<void>;
}

export function useStakeDecAction({
  username,
  enabledRegions,
  onSuccess,
}: Params): UseStakeDecAction {
  const [busy, setBusy] = useState(false);
  const [dryRun, setDryRun] = useState<StakeDecPlan | null>(null);
  const [decBalance, setDecBalance] = useState<number | null>(null);
  const [result, setResult] = useState<StakeDecExecuteResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const preview = useCallback(async () => {
    setBusy(true);
    setError(null);
    setDryRun(null);
    setDecBalance(null);
    try {
      const [plan, balance] = await Promise.all([
        getStakeDecPlan(enabledRegions),
        username ? getDecBalance(username) : Promise.resolve(0),
      ]);
      setDryRun(plan);
      setDecBalance(balance);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  }, [enabledRegions, username]);

  const execute = useCallback(async () => {
    if (!username) {
      setError("Not logged in.");
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);

    // Re-fetch right before broadcast — the in_use / needed numbers can
    // have moved since the dry run dialog opened (other tabs, manual stakes,
    // etc.). The freshly-fetched plan is what we actually broadcast.
    let plan: StakeDecPlan;
    let balance: number;
    try {
      [plan, balance] = await Promise.all([
        getStakeDecPlan(enabledRegions),
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
    setDryRun(plan);
    setDecBalance(balance);

    if (plan.items.length === 0) {
      setError("No DEC shortfall left to stake.");
      setBusy(false);
      return;
    }
    if (balance < plan.total_dec) {
      setError(
        `Insufficient DEC: need ${plan.total_dec.toLocaleString("en-US")} but have ${balance.toLocaleString("en-US", { maximumFractionDigits: 3 })}. Top up and re-run.`
      );
      setBusy(false);
      return;
    }

    const succeededByRegion: Record<string, number> = {};
    const failedByRegion: Record<string, number> = {};
    const txIds: string[] = [];
    let phaseError: string | null = null;

    try {
      // One op per region. Broadcast as a single batched call so Keychain
      // pops up once. If a chunk rejects, broadcastOperations stops and
      // returns the txIds that did succeed.
      const ops = plan.items.map((it) =>
        buildStakeDecRegionOp(username, it.region_uid, it.shortfall)
      );
      const res = await broadcastOperations(
        username,
        ops,
        KeychainKeyTypes.posting
      );
      txIds.push(...res.txIds);

      // Mirror the operation order: each tx id corresponds to the next region
      // in the plan. If broadcast failed mid-way, the rest are "attempted but
      // failed" and recorded as such.
      const succeededCount = res.txIds.length;
      for (let i = 0; i < plan.items.length; i++) {
        const it = plan.items[i];
        if (i < succeededCount) {
          succeededByRegion[it.region_uid] = it.shortfall;
        } else {
          failedByRegion[it.region_uid] = it.shortfall;
        }
      }
      if (!res.success) {
        phaseError = `Stake broadcast failed: ${res.error ?? "unknown error"}.`;
      }

      if (res.txIds.length > 0) {
        await waitForTransactions(res.txIds, lookupTransaction);
      }

      const totalSucceeded = Object.values(succeededByRegion).reduce(
        (s, v) => s + v,
        0
      );
      const totalFailed = Object.values(failedByRegion).reduce(
        (s, v) => s + v,
        0
      );

      setResult({
        success: phaseError === null,
        txIds,
        succeededByRegion,
        failedByRegion,
        totalSucceeded,
        totalFailed,
      });
      if (phaseError) setError(phaseError);

      // Always log — including partial successes and full failures — so the
      // admin can see what was attempted vs. what landed.
      recordStakeDecLog({
        player: username,
        succeeded: succeededByRegion,
        failed: failedByRegion,
        error: phaseError,
        txIds,
      }).catch(() => {});

      if (!phaseError) {
        setDryRun(null);
        onSuccess?.();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      // Mark anything we didn't get a tx id for as failed and log it.
      for (let i = 0; i < plan.items.length; i++) {
        const it = plan.items[i];
        if (i < txIds.length) continue;
        failedByRegion[it.region_uid] =
          (failedByRegion[it.region_uid] ?? 0) + it.shortfall;
      }
      recordStakeDecLog({
        player: username,
        succeeded: succeededByRegion,
        failed: failedByRegion,
        error: msg,
        txIds,
      }).catch(() => {});
    } finally {
      setBusy(false);
    }
  }, [username, enabledRegions, onSuccess]);

  return {
    busy,
    dryRun,
    decBalance,
    result,
    error,
    clearDryRun: () => setDryRun(null),
    clearResult: () => setResult(null),
    clearError: () => setError(null),
    preview,
    execute,
  };
}
