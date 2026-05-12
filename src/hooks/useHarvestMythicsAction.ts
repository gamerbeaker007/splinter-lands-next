import { recordMythicHarvestLog } from "@/lib/backend/actions/land-manager/log-actions";
import {
  getPlayerMythicDeeds,
  lookupTransaction,
} from "@/lib/backend/actions/land-manager/overview-actions";
import { buildTaxCollectionOp } from "@/lib/frontend/opBuilders";
import {
  BroadcastResult,
  broadcastOperations,
  waitForTransactions,
} from "@/lib/frontend/splBroadcast";
import { DryRunResult, MythicHarvestResult } from "@/types/landManager";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import { useCallback, useState } from "react";

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

        if (!isDryRun && !mythicDeeds.some((d) => d.taxes.length > 0)) {
          setError("No mythic deeds have resources to harvest.");
          return null;
        }

        const ops: [string, object][] = mythicDeeds.map((deed) =>
          buildTaxCollectionOp(username, deed.region_uid, deed.deed_uid)
        );

        if (isDryRun) {
          const log = mythicDeeds.map((d) => {
            const taxes =
              d.taxes.map((t) => `${t.token} ${t.balance}`).join(", ") ||
              "nothing";
            return `${d.kingdom_type} ${d.deed_uid}: ${taxes}`;
          });
          return { title: "Dry Run — Harvest Mythics", log, ops };
        } else if (ops.length === 0) {
          setError("No mythic deeds found.");
        } else {
          const res = await broadcastOperations(username, ops);
          if (!res.success) {
            setError(res.error ?? "Broadcast failed");
            return null;
          }

          setInternalBusy("verifying");
          await waitForTransactions(res.txIds, lookupTransaction);

          const harvestResults: MythicHarvestResult[] = mythicDeeds.map(
            (d) => ({
              deed_uid: d.deed_uid,
              region_uid: d.region_uid,
              kingdom_type: d.kingdom_type,
              tokens: d.taxes.map((t) => ({
                token: t.token,
                received: String(t.balance),
              })),
              fragment_found: false,
              fragment_chance: d.estimated_totem_chance ?? 0,
            })
          );

          await recordMythicHarvestLog(
            username,
            harvestResults,
            res.txIds
          ).catch(() => {});
          setResult(res);
          onSuccess?.();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setInternalBusy(null);
      }
      return null;
    },
    [username, visibleRegions, onSuccess]
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
