import { recordMakeHarvestableLog } from "@/lib/backend/actions/land-manager/log-actions";
import {
  getBulkRegionData,
  getDecBalance,
  getLandPools,
  lookupTransaction,
} from "@/lib/backend/actions/land-manager/overview-actions";
import { buildMakeHarvestableOps } from "@/lib/frontend/makeHarvestableOps";
import {
  BroadcastResult,
  broadcastOperations,
  waitForTransactions,
} from "@/lib/frontend/splBroadcast";
import { effectiveBalance } from "@/lib/shared/landManagerUtils";
import { DryRunResult, MakeHarvestableStrategy } from "@/types/landManager";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import { useCallback, useState } from "react";

interface Params {
  username: string;
  visibleRegions: SplProductionOverviewRegion[];
  strategies: MakeHarvestableStrategy[];
  onSuccess?: () => void;
}

interface UseMakeHarvestableAction {
  busy: boolean;
  result: BroadcastResult | null;
  error: string | null;
  clearResult: () => void;
  clearError: () => void;
  execute: (isDryRun: boolean) => Promise<DryRunResult | null>;
}

export function useMakeHarvestableAction({
  username,
  visibleRegions,
  strategies,
  onSuccess,
}: Params): UseMakeHarvestableAction {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<BroadcastResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (isDryRun: boolean): Promise<DryRunResult | null> => {
      setBusy(true);
      setResult(null);
      setError(null);
      try {
        const [{ harvestable, balances }, dec] = await Promise.all([
          getBulkRegionData(visibleRegions.map((r) => r.region_uid)),
          getDecBalance(username),
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
        // Fetch pools as late as possible — right before building ops —
        // to minimise stale pool data causing slippage failures on-chain.
        const { pools } = await getLandPools();
        const { ops, log, actions } = buildMakeHarvestableOps(
          visibleRegions,
          username,
          harvestable,
          adjustedBalances,
          strategies,
          dec,
          pools
        );

        if (isDryRun) {
          return { title: "Dry Run — Make All Harvestable", log, ops };
        } else if (ops.length === 0) {
          setError(
            "All regions are already harvestable (or no strategies could help)."
          );
        } else {
          const res = await broadcastOperations(username, ops);
          if (!res.success) {
            setError(res.error ?? "Broadcast failed");
          } else {
            await waitForTransactions(res.txIds, lookupTransaction);
            await recordMakeHarvestableLog(username, actions, res.txIds).catch(
              () => {}
            );
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
    [username, visibleRegions, strategies, onSuccess]
  );

  return {
    busy,
    result,
    error,
    clearResult: () => setResult(null),
    clearError: () => setError(null),
    execute,
  };
}
