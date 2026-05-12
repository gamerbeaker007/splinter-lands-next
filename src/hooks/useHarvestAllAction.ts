import {
  acknowledgeHarvest,
  recordHarvestLog,
} from "@/lib/backend/actions/land-manager/log-actions";
import {
  getBulkRegionData,
  getLandPools,
  lookupTransaction,
} from "@/lib/backend/actions/land-manager/overview-actions";
import { buildRegionHarvestOps } from "@/lib/frontend/harvestOps";
import {
  BroadcastResult,
  broadcastOperations,
  waitForTransactions,
} from "@/lib/frontend/splBroadcast";
import {
  canHarvestRegion,
  effectiveBalance,
} from "@/lib/shared/landManagerUtils";
import { DryRunResult } from "@/types/landManager";
import {
  SplHarvestableResource,
  SplProductionOverviewRegion,
} from "@/types/spl/landManager";
import { SplLandPool } from "@/types/spl/landPools";
import { useCallback, useState } from "react";

interface Params {
  username: string;
  visibleRegions: SplProductionOverviewRegion[];
  harvestAck: boolean;
  onSuccess?: () => void;
}

interface UseHarvestAllAction {
  busy: boolean;
  result: BroadcastResult | null;
  error: string | null;
  clearResult: () => void;
  clearError: () => void;
  showConfirm: boolean;
  onConfirm: (ack: boolean) => void;
  onCancelConfirm: () => void;
  execute: (isDryRun: boolean) => Promise<DryRunResult | null>;
}

function buildHarvestAllOps(
  visibleRegions: SplProductionOverviewRegion[],
  username: string,
  harvestableMap: Record<string, SplHarvestableResource[]>,
  balancesMap: Record<string, Record<string, number>>,
  pools: SplLandPool[]
): { ops: [string, object][]; log: string[] } {
  const ops: [string, object][] = [];
  const log: string[] = [];

  for (const region of visibleRegions) {
    const harvestable = harvestableMap[region.region_uid] ?? [];
    const balance = balancesMap[region.region_uid] ?? {
      GRAIN: 0,
      WOOD: 0,
      STONE: 0,
      IRON: 0,
      AURA: 0,
    };

    if (!canHarvestRegion(harvestable, balance)) {
      log.push(`[${region.name}] skip — cannot afford harvest`);
      continue;
    }

    const { ops: regionOps, log: regionLog } = buildRegionHarvestOps(
      username,
      region,
      harvestable,
      pools
    );
    ops.push(...regionOps);
    log.push(...regionLog);
  }

  return { ops, log };
}

export function useHarvestAllAction({
  username,
  visibleRegions,
  harvestAck,
  onSuccess,
}: Params): UseHarvestAllAction {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<BroadcastResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingDryRun, setPendingDryRun] = useState(false);

  const doExecute = useCallback(
    async (isDryRun: boolean): Promise<DryRunResult | null> => {
      setBusy(true);
      setResult(null);
      setError(null);
      try {
        const [{ harvestable, balances }, { pools }] = await Promise.all([
          getBulkRegionData(visibleRegions.map((r) => r.region_uid)),
          getLandPools(),
        ]);
        const adjustedBalances = Object.fromEntries(
          visibleRegions.map((r) => [
            r.region_uid,
            effectiveBalance(
              balances[r.region_uid] ?? {
                GRAIN: 0,
                WOOD: 0,
                STONE: 0,
                IRON: 0,
                AURA: 0,
              },
              r
            ),
          ])
        );
        const { ops, log } = buildHarvestAllOps(
          visibleRegions,
          username,
          harvestable,
          adjustedBalances,
          pools
        );

        if (isDryRun) {
          return { title: "Dry Run — Harvest All", log, ops };
        } else if (ops.length === 0) {
          setError("No regions are ready to harvest.");
        } else {
          const res = await broadcastOperations(username, ops);
          if (!res.success) {
            setError(res.error ?? "Broadcast failed");
          } else {
            await waitForTransactions(res.txIds, lookupTransaction);
            await recordHarvestLog(
              username,
              visibleRegions,
              harvestable,
              res.txIds
            ).catch(() => {});
            setResult(res);
            onSuccess?.();
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setBusy(false);
      }
      return null;
    },
    [username, visibleRegions, onSuccess]
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
    busy,
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
