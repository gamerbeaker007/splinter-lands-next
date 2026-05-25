import { getTodayPaidFees } from "@/lib/backend/actions/land-manager/fee-actions";
import {
  getBulkRegionData,
  lookupTransaction,
} from "@/lib/backend/actions/land-manager/overview-actions";
import {
  applyDailyCaps,
  buildFeeOps,
  capFeesAtBalance,
  DesiredFee,
  summarizeFees,
} from "@/lib/frontend/feePayment";
import {
  broadcastOperations,
  KeychainKeyTypes,
  waitForTransactions,
} from "@/lib/frontend/splBroadcast";
import { SplLandPool } from "@/types/spl/landPools";
import { useCallback, useState } from "react";

export interface PayFeesResult {
  /** True when every requested fee op (posting + active) broadcast and confirmed. */
  success: boolean;
  paidFees: Record<string, number>;
  unpaidFees: Record<string, number>;
  feeError: string | null;
  txIds: string[];
  log: string[];
}

export interface UsePayFees {
  busy: boolean;
  result: PayFeesResult | null;
  clear: () => void;
  /**
   * Settle the supplied fees:
   *   1. Fetch today’s already-paid fees and apply the daily cap.
   *   2. Refetch region balances so caps are based on what’s actually
   *      available now.
   *   3. capFeesAtBalance — drops/zeroes regions that don’t have enough.
   *   4. Broadcast resource transfers (posting key), awaiting confirmation.
   * Returns paid + unpaid totals so the caller can persist them.
   */
  execute: (
    desired: DesiredFee[],
    pools: SplLandPool[]
  ) => Promise<PayFeesResult>;
}

const EMPTY_RESULT: PayFeesResult = {
  success: true,
  paidFees: {},
  unpaidFees: {},
  feeError: null,
  txIds: [],
  log: [],
};

export function usePayFees(username: string): UsePayFees {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PayFeesResult | null>(null);

  const execute = useCallback(
    async (
      desired: DesiredFee[],
      pools: SplLandPool[]
    ): Promise<PayFeesResult> => {
      setBusy(true);
      setResult(null);

      const log: string[] = [];

      if (desired.length === 0) {
        log.push("No fees to pay this run.");
        const r = { ...EMPTY_RESULT, log };
        setResult(r);
        setBusy(false);
        return r;
      }

      // Apply daily fee caps using fees already paid today.
      let alreadyPaid: Record<string, number> = {};
      try {
        alreadyPaid = await getTodayPaidFees(username);
      } catch {
        // Non-fatal: if we can't read the daily total, proceed without capping.
        log.push(
          "⚠ Could not read today's paid fees — daily cap not applied this run."
        );
      }
      const dailyCapped = applyDailyCaps(desired, alreadyPaid);
      if (dailyCapped.length < desired.length) {
        const dropped = desired
          .filter(
            (f) =>
              !dailyCapped.some(
                (c) => c.region_uid === f.region_uid && c.symbol === f.symbol
              )
          )
          .map((f) => `${f.symbol} (${f.region_name})`);
        log.push(`  ℹ Daily cap reached — skipping: ${dropped.join(", ")}`);
      }
      if (dailyCapped.length === 0) {
        log.push(
          "Daily fee cap reached for all resources — no fees owed this run."
        );
        const r = { ...EMPTY_RESULT, log };
        setResult(r);
        setBusy(false);
        return r;
      }

      // Refresh balances so balance caps are based on the post-harvest state.
      let balances: Record<string, Record<string, number>> = {};
      try {
        const regionUids = [...new Set(dailyCapped.map((f) => f.region_uid))];
        const refreshed = await getBulkRegionData(regionUids, true);
        balances = refreshed.balances;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Balance refresh failed";
        log.push(`⚠ ${message} — cannot determine capped fees`);
        const desiredTotals = summarizeFees(dailyCapped);
        const r: PayFeesResult = {
          success: false,
          paidFees: {},
          unpaidFees: desiredTotals,
          feeError: message,
          txIds: [],
          log,
        };
        setResult(r);
        setBusy(false);
        return r;
      }

      const plan = capFeesAtBalance(dailyCapped, balances);
      for (const fee of plan) {
        if (fee.capped) {
          log.push(
            `  ⚠ Fee for ${fee.region_name} ${fee.symbol} capped at ${fee.amount} (owed ${fee.desired_amount}, region balance too low)`
          );
        }
      }

      if (plan.length === 0) {
        log.push(
          "After capping, no fees can be paid (regions have no balance to spare)."
        );
        const r: PayFeesResult = {
          success: true,
          paidFees: {},
          unpaidFees: summarizeFees(dailyCapped),
          feeError: "All fees capped to zero (insufficient region balances)",
          txIds: [],
          log,
        };
        setResult(r);
        setBusy(false);
        return r;
      }

      const { postingOps, log: feeLog } = buildFeeOps(username, pools, plan);
      log.push(...feeLog);

      const txIds: string[] = [];
      let feeError: string | null = null;

      if (postingOps.length > 0) {
        try {
          const res = await broadcastOperations(
            username,
            postingOps,
            KeychainKeyTypes.posting
          );
          if (res.success) {
            txIds.push(...res.txIds);
            await waitForTransactions(res.txIds, lookupTransaction);
          } else {
            feeError = res.error ?? "Resource fee broadcast rejected";
          }
        } catch (err) {
          feeError = err instanceof Error ? err.message : "Resource fee failed";
        }
      }

      const plannedTotals = summarizeFees(plan);
      let paidFees: Record<string, number>;
      let unpaidFees: Record<string, number>;
      if (feeError === null) {
        paidFees = plannedTotals;
        unpaidFees = {};
      } else {
        // Partial-failure case: we don't know which subset went through, so
        // log everything we tried to pay as unpaid and let the admin
        // reconcile from tx history.
        paidFees = {};
        unpaidFees = plannedTotals;
        log.push(`✗ Fee step did not complete: ${feeError}`);
      }

      const r: PayFeesResult = {
        success: feeError === null,
        paidFees,
        unpaidFees,
        feeError,
        txIds,
        log,
      };
      setResult(r);
      setBusy(false);
      return r;
    },
    [username]
  );

  return {
    busy,
    result,
    clear: () => setResult(null),
    execute,
  };
}
