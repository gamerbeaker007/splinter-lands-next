import { recordPostHarvestLog } from "@/lib/backend/actions/land-manager/log-actions";
import {
  getBulkRegionData,
  getLandPools,
  lookupTransaction,
} from "@/lib/backend/actions/land-manager/overview-actions";
import { buildPostHarvestOps } from "@/lib/frontend/postHarvestOps";
import {
  BroadcastResult,
  broadcastOperations,
  waitForTransactions,
} from "@/lib/frontend/splBroadcast";
import { DryRunResult, PostHarvestStrategy } from "@/types/landManager";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import { useCallback, useState } from "react";

interface Params {
  username: string;
  visibleRegions: SplProductionOverviewRegion[];
  postHarvestStrategy: PostHarvestStrategy;
  onSuccess?: () => void;
}

interface UseProcessResourcesAction {
  busy: boolean;
  result: BroadcastResult | null;
  error: string | null;
  clearResult: () => void;
  clearError: () => void;
  execute: (isDryRun: boolean) => Promise<DryRunResult | null>;
}

export function useProcessResourcesAction({
  username,
  visibleRegions,
  postHarvestStrategy,
  onSuccess,
}: Params): UseProcessResourcesAction {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<BroadcastResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (isDryRun: boolean): Promise<DryRunResult | null> => {
      setBusy(true);
      setResult(null);
      setError(null);
      try {
        const [{ balances }, { pools }] = await Promise.all([
          getBulkRegionData(visibleRegions.map((r) => r.region_uid)),
          getLandPools(),
        ]);
        const { ops, log, actions } = buildPostHarvestOps(
          visibleRegions,
          username,
          balances,
          pools,
          postHarvestStrategy
        );

        if (isDryRun) {
          return { title: "Dry Run — Process Resources", log, ops };
        } else if (ops.length === 0) {
          setError(
            "No resources to process (all below minimum or strategy is accumulate)."
          );
        } else {
          const res = await broadcastOperations(username, ops);
          if (!res.success) {
            setError(res.error ?? "Broadcast failed");
          } else {
            await waitForTransactions(res.txIds, lookupTransaction);
            await recordPostHarvestLog(username, actions, res.txIds).catch(
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
    [username, visibleRegions, postHarvestStrategy, onSuccess]
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
