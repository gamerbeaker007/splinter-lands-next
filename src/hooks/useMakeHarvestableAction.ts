import { recordMakeHarvestableLog } from "@/lib/backend/actions/land-manager/log-actions";
import {
  getBulkRegionData,
  getDecBalance,
  getLandPools,
  getPlayerPoolPositions,
  invalidatePlayerRegionCaches,
} from "@/lib/backend/actions/land-manager/overview-actions";
import { buildMakeHarvestableOps } from "@/lib/frontend/makeHarvestableOps";
import { computePoolHolding } from "@/lib/shared/poolPositionUtils";
import { NATURAL_RESOURCES } from "@/lib/shared/statics";
import {
  BroadcastResult,
  broadcastOperations,
  waitForTransactions,
} from "@/lib/frontend/splBroadcast";
import { effectiveBalance } from "@/lib/shared/landManagerUtils";
import { ActionPlan, MakeHarvestableStrategy } from "@/types/landManager";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import { SplPlayerPoolPosition } from "@/types/spl/landPools";
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
  execute: (planOnly: boolean) => Promise<ActionPlan | null>;
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
    async (planOnly: boolean): Promise<ActionPlan | null> => {
      setBusy(true);
      setResult(null);
      setError(null);
      try {
        const [{ harvestable, balances }, dec] = await Promise.all([
          getBulkRegionData(
            visibleRegions.map((r) => r.region_uid),
            !planOnly
          ),
          getDecBalance(username),
        ]);
        const EMPTY: Record<string, number> = {
          GRAIN: 0,
          WOOD: 0,
          STONE: 0,
          IRON: 0,
          AURA: 0,
        };
        const storedBalances = Object.fromEntries(
          visibleRegions.map((r) => [
            r.region_uid,
            { ...(balances[r.region_uid] ?? EMPTY) },
          ])
        );
        const adjustedBalances = Object.fromEntries(
          visibleRegions.map((r) => [
            r.region_uid,
            effectiveBalance(balances[r.region_uid] ?? EMPTY, r),
          ])
        );
        // Fetch pools as late as possible — right before building ops —
        // to minimise stale pool data causing slippage failures on-chain.
        // Positions are only needed when the `pool` strategy is enabled; the
        // share math also needs the pool totals, so both are fetched together.
        const usesPool = strategies.includes("pool");
        const [{ pools }, positions] = await Promise.all([
          getLandPools(),
          usesPool
            ? getPlayerPoolPositions(username, NATURAL_RESOURCES, !planOnly)
            : Promise.resolve({} as Record<string, SplPlayerPoolPosition>),
        ]);
        const poolHoldings = Object.fromEntries(
          Object.entries(positions).map(([symbol, position]) => [
            symbol,
            computePoolHolding(position, pools),
          ])
        );

        const { ops, log, actions } = buildMakeHarvestableOps(
          visibleRegions,
          username,
          harvestable,
          {
            effective: adjustedBalances,
            stored: storedBalances,
            poolHoldings,
          },
          strategies,
          dec,
          pools
        );

        if (planOnly) {
          return { title: "Review plan — Make All Harvestable", log };
        } else if (ops.length === 0) {
          setError(
            "All regions are already harvestable (or no strategies could help)."
          );
        } else {
          const res = await broadcastOperations(username, ops);
          if (!res.success) {
            setError(res.error ?? "Broadcast failed");
          } else {
            await waitForTransactions(res.txIds);
            await recordMakeHarvestableLog(username, actions, res.txIds).catch(
              () => {}
            );
            setResult(res);
            // Clear the cached pre-action snapshot so the refresh below reads
            // post-action balances rather than winning a cache hit on stale data.
            await invalidatePlayerRegionCaches().catch(() => {});
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
