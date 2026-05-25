import {
  getFeeApplicableRegionNumbers,
  getTodayPaidFees,
} from "@/lib/backend/actions/land-manager/fee-actions";
import {
  acknowledgeHarvest,
  recordFeesLog,
  recordHarvestLog,
} from "@/lib/backend/actions/land-manager/log-actions";
import {
  getBulkRegionData,
  getLandPools,
} from "@/lib/backend/actions/land-manager/overview-actions";
import {
  broadcastHarvest,
  HarvestBroadcastResult,
} from "@/lib/frontend/executeHarvestFlow";
import {
  applyDailyCaps,
  buildFeeOps,
  capFeesAtBalance,
  planDesiredFees,
  summarizeFees,
} from "@/lib/frontend/feePayment";
import {
  buildRegionHarvestOnlyOp,
  summarizeHarvestedResources,
} from "@/lib/frontend/harvestOps";
import {
  canHarvestRegion,
  effectiveBalance,
} from "@/lib/shared/landManagerUtils";
import { DryRunResult } from "@/types/landManager";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import { useCallback, useState } from "react";
import { PayFeesResult, usePayFees } from "./usePayFees";

interface Params {
  username: string;
  visibleRegions: SplProductionOverviewRegion[];
  harvestAck: boolean;
  onSuccess?: () => void;
}

export interface HarvestAllResult {
  success: boolean;
  txIds: string[];
  harvestTxIds: string[];
  fees: PayFeesResult | null;
  log: string[];
}

interface UseHarvestAllAction {
  busy: boolean;
  result: HarvestAllResult | null;
  error: string | null;
  clearResult: () => void;
  clearError: () => void;
  showConfirm: boolean;
  onConfirm: (ack: boolean) => void;
  onCancelConfirm: () => void;
  execute: (isDryRun: boolean) => Promise<DryRunResult | null>;
}

const EMPTY_BALANCE: Record<string, number> = {
  GRAIN: 0,
  WOOD: 0,
  STONE: 0,
  IRON: 0,
  AURA: 0,
};

export function useHarvestAllAction({
  username,
  visibleRegions,
  harvestAck,
  onSuccess,
}: Params): UseHarvestAllAction {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<HarvestAllResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingDryRun, setPendingDryRun] = useState(false);
  const payFees = usePayFees(username);

  const doExecute = useCallback(
    async (isDryRun: boolean): Promise<DryRunResult | null> => {
      setBusy(true);
      setResult(null);
      setError(null);
      try {
        const [{ harvestable, balances }, { pools }] = await Promise.all([
          getBulkRegionData(
            visibleRegions.map((r) => r.region_uid),
            !isDryRun
          ),
          getLandPools(),
        ]);
        const adjustedBalances = Object.fromEntries(
          visibleRegions.map((r) => [
            r.region_uid,
            effectiveBalance(balances[r.region_uid] ?? EMPTY_BALANCE, r),
          ])
        );

        const eligibleRegions = visibleRegions.filter((r) =>
          canHarvestRegion(
            harvestable[r.region_uid] ?? [],
            adjustedBalances[r.region_uid]
          )
        );

        if (isDryRun) {
          const log: string[] = [];
          for (const region of eligibleRegions) {
            const built = buildRegionHarvestOnlyOp(username, region);
            log.push(...built.log);
          }
          const feeApplicable = new Set(
            await getFeeApplicableRegionNumbers(
              username,
              eligibleRegions.map((r) => r.region_number)
            )
          );
          // For preview, cap against the pre-harvest effective balance — best
          // estimate we have without actually broadcasting.
          const desired = planDesiredFees(eligibleRegions, harvestable, (n) =>
            feeApplicable.has(n)
          );
          const alreadyPaid = await getTodayPaidFees(username).catch(
            () => ({})
          );
          const dailyCapped = applyDailyCaps(desired, alreadyPaid);
          const capped = capFeesAtBalance(dailyCapped, adjustedBalances);
          const { log: feeLog } = buildFeeOps(username, pools, capped);
          log.push(...feeLog);
          return { title: "Dry Run — Harvest All", log };
        }

        if (eligibleRegions.length === 0) {
          setError("No regions are ready to harvest.");
          return null;
        }

        // ── Phase 1: harvest ──
        const harvestRes: HarvestBroadcastResult = await broadcastHarvest(
          username,
          eligibleRegions
        );
        if (!harvestRes.success) {
          setError(harvestRes.error ?? "Harvest failed");
          return null;
        }
        const harvestedSummary = summarizeHarvestedResources(harvestable);
        await recordHarvestLog({
          player: username,
          resources: harvestedSummary,
          txIds: harvestRes.txIds,
        }).catch(() => {});

        // ── Phase 2: fees ──
        const feeApplicable = new Set(
          await getFeeApplicableRegionNumbers(
            username,
            eligibleRegions.map((r) => r.region_number)
          )
        );
        const desired = planDesiredFees(eligibleRegions, harvestable, (n) =>
          feeApplicable.has(n)
        );
        let feeOutcome: PayFeesResult | null = null;
        if (desired.length === 0) {
          // Nothing to pay — clean run, skip the fee log entirely.
          feeOutcome = {
            success: true,
            paidFees: {},
            unpaidFees: {},
            feeError: null,
            txIds: [],
            log: ["No transferrable fees to pay this run."],
          };
        } else {
          feeOutcome = await payFees.execute(desired, pools);
          // Always persist what was attempted — paid and/or unpaid plus reason.
          await recordFeesLog({
            player: username,
            paidFees: feeOutcome.paidFees,
            unpaidFees: feeOutcome.unpaidFees,
            feeError: feeOutcome.feeError,
            txIds: feeOutcome.txIds,
          }).catch(() => {});
          if (feeOutcome.feeError) setError(feeOutcome.feeError);
        }

        setResult({
          success: feeOutcome.success,
          txIds: [...harvestRes.txIds, ...feeOutcome.txIds],
          harvestTxIds: harvestRes.txIds,
          fees: feeOutcome,
          log: [...harvestRes.log, ...feeOutcome.log],
        });
        onSuccess?.();
        // Silence unused-var lint in case payFees is later replaced.
        void summarizeFees;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setBusy(false);
      }
      return null;
    },
    [username, visibleRegions, onSuccess, payFees]
  );

  const execute = useCallback(
    async (isDryRun: boolean): Promise<DryRunResult | null> => {
      if (!isDryRun && !harvestAck) {
        setPendingDryRun(false);
        setShowConfirm(true);
        return null;
      }
      return doExecute(isDryRun);
    },
    [harvestAck, doExecute]
  );

  const onConfirm = useCallback(
    (ack: boolean) => {
      setShowConfirm(false);
      if (ack) acknowledgeHarvest().catch(() => {});
      doExecute(pendingDryRun);
    },
    [doExecute, pendingDryRun]
  );

  const onCancelConfirm = useCallback(() => setShowConfirm(false), []);

  return {
    busy: busy || payFees.busy,
    result,
    error,
    clearResult: () => {
      setResult(null);
      payFees.clear();
    },
    clearError: () => setError(null),
    showConfirm,
    onConfirm,
    onCancelConfirm,
    execute,
  };
}
