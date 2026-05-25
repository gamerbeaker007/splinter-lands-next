import {
  getFeeApplicableRegionNumbers,
  getTodayPaidFees,
} from "@/lib/backend/actions/land-manager/fee-actions";
import { recordMythicHarvestLog } from "@/lib/backend/actions/land-manager/log-actions";
import {
  getBulkRegionData,
  getLandPools,
  getPlayerMythicDeeds,
  lookupTransaction,
} from "@/lib/backend/actions/land-manager/overview-actions";
import {
  applyDailyCaps,
  buildFeeOps,
  capFeesAtBalance,
  planMythicFees,
} from "@/lib/frontend/feePayment";
import { buildTaxCollectionOp } from "@/lib/frontend/opBuilders";
import {
  BroadcastResult,
  broadcastOperations,
  waitForTransactions,
} from "@/lib/frontend/splBroadcast";
import { DryRunResult, MythicHarvestResult } from "@/types/landManager";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import { useCallback, useState } from "react";
import { PayFeesResult, usePayFees } from "./usePayFees";

interface Params {
  username: string;
  visibleRegions: SplProductionOverviewRegion[];
  mythicFeeAccepted: boolean;
  onSuccess?: () => void;
}

interface UseHarvestMythicsAction {
  busy: boolean;
  isVerifying: boolean;
  result: BroadcastResult | null;
  error: string | null;
  clearResult: () => void;
  clearError: () => void;
  showConfirm: boolean;
  onConfirm: (ack: boolean) => void;
  onCancelConfirm: () => void;
  execute: (isDryRun: boolean) => Promise<DryRunResult | null>;
}

type InternalBusy = "running" | "verifying" | null;

export function useHarvestMythicsAction({
  username,
  visibleRegions,
  mythicFeeAccepted,
  onSuccess,
}: Params): UseHarvestMythicsAction {
  const [internalBusy, setInternalBusy] = useState<InternalBusy>(null);
  const [result, setResult] = useState<BroadcastResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingDryRun, setPendingDryRun] = useState(false);
  const payFees = usePayFees(username);

  const doExecute = useCallback(
    async (isDryRun: boolean): Promise<DryRunResult | null> => {
      setInternalBusy("running");
      setResult(null);
      setError(null);
      try {
        const enabledUids = new Set(visibleRegions.map((r) => r.region_uid));
        const allDeeds = await getPlayerMythicDeeds();
        const mythicDeeds = allDeeds.filter((d) =>
          enabledUids.has(d.region_uid)
        );
        const regionNameMap = new Map(
          visibleRegions.map((r) => [r.region_uid, r.name])
        );

        if (isDryRun) {
          const [{ pools }, { balances }, feeApplicableNums] =
            await Promise.all([
              getLandPools(),
              getBulkRegionData(
                visibleRegions.map((r) => r.region_uid),
                !isDryRun
              ),
              getFeeApplicableRegionNumbers(username, [
                ...new Set(mythicDeeds.map((d) => d.region_number)),
              ]),
            ]);
          const feeApplicable = new Set(feeApplicableNums);
          const log = mythicDeeds.map((d) => {
            const taxes =
              d.taxes.map((t) => `${t.token} ${t.balance}`).join(", ") ||
              "nothing";
            const loc =
              d.kingdom_type === "keep"
                ? `region(${d.region_number}) tract(${d.tract_number})`
                : `region(${d.region_number})`;
            return `${d.kingdom_type} ${loc}: ${taxes}`;
          });
          const desired = planMythicFees(mythicDeeds, regionNameMap, (n) =>
            feeApplicable.has(n)
          );
          const alreadyPaid = await getTodayPaidFees(username).catch(
            () => ({})
          );
          const dailyCapped = applyDailyCaps(desired, alreadyPaid);
          const capped = capFeesAtBalance(dailyCapped, balances);
          const { log: feeLog } = buildFeeOps(username, pools, capped);
          log.push(...feeLog);
          return { title: "Dry Run — Harvest Mythics", log };
        }

        if (!mythicDeeds.some((d) => d.taxes.length > 0)) {
          setError("No mythic deeds have resources to harvest.");
          return null;
        }

        const ops: [string, object][] = mythicDeeds.map((deed) =>
          buildTaxCollectionOp(username, deed.region_uid, deed.deed_uid)
        );
        if (ops.length === 0) {
          setError("No mythic deeds found.");
          return null;
        }

        // ── Phase 1: harvest ──
        const res = await broadcastOperations(username, ops);
        if (!res.success) {
          setError(res.error ?? "Broadcast failed");
          return null;
        }

        setInternalBusy("verifying");
        await waitForTransactions(res.txIds, lookupTransaction);

        const harvestResults: MythicHarvestResult[] = mythicDeeds.map((d) => ({
          deed_uid: d.deed_uid,
          region_uid: d.region_uid,
          region_number: d.region_number,
          tract_number: d.tract_number,
          kingdom_type: d.kingdom_type,
          tokens: d.taxes.map((t) => ({
            token: t.token,
            received: String(t.balance),
          })),
          fragment_found: false,
          fragment_chance: d.estimated_totem_chance ?? 0,
        }));

        // ── Phase 2: fees ──
        setInternalBusy("running");
        const [{ pools }, feeApplicableNums] = await Promise.all([
          getLandPools(),
          getFeeApplicableRegionNumbers(username, [
            ...new Set(mythicDeeds.map((d) => d.region_number)),
          ]),
        ]);
        const feeApplicable = new Set(feeApplicableNums);
        const desired = planMythicFees(mythicDeeds, regionNameMap, (n) =>
          feeApplicable.has(n)
        );
        let feeOutcome: PayFeesResult;
        if (desired.length === 0) {
          feeOutcome = {
            success: true,
            paidFees: {},
            unpaidFees: {},
            feeError: null,
            txIds: [],
            log: ["No transferrable fees to pay."],
          };
        } else {
          feeOutcome = await payFees.execute(desired, pools);
          if (feeOutcome.feeError) setError(feeOutcome.feeError);
        }

        await recordMythicHarvestLog(username, harvestResults, res.txIds, {
          paidFees: feeOutcome.paidFees,
          unpaidFees: feeOutcome.unpaidFees,
          feeError: feeOutcome.feeError,
          feeTxIds: feeOutcome.txIds,
        }).catch(() => {});
        setResult(res);
        onSuccess?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setInternalBusy(null);
      }
      return null;
    },
    [username, visibleRegions, onSuccess, payFees]
  );

  const execute = useCallback(
    async (isDryRun: boolean): Promise<DryRunResult | null> => {
      if (!isDryRun && !mythicFeeAccepted) {
        setPendingDryRun(false);
        setShowConfirm(true);
        return null;
      }
      return doExecute(isDryRun);
    },
    [mythicFeeAccepted, doExecute]
  );

  const onConfirm = useCallback(
    (ack: boolean) => {
      setShowConfirm(false);
      if (ack) {
        import("@/lib/backend/actions/land-manager/config-actions").then((m) =>
          m.saveMythicFeeAccepted().catch(() => {})
        );
      }
      doExecute(pendingDryRun);
    },
    [doExecute, pendingDryRun]
  );

  const onCancelConfirm = useCallback(() => setShowConfirm(false), []);

  return {
    busy: internalBusy !== null,
    isVerifying: internalBusy === "verifying",
    result,
    error,
    clearResult: () => setResult(null),
    clearError: () => setError(null),
    showConfirm,
    onConfirm,
    onCancelConfirm,
    execute,
  };
}
