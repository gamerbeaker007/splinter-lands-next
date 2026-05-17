import { recordPostHarvestLog } from "@/lib/backend/actions/land-manager/log-actions";
import {
  getBulkRegionData,
  getLandPools,
  lookupTransaction,
} from "@/lib/backend/actions/land-manager/overview-actions";
import { buildAddLiquidityOp } from "@/lib/frontend/opBuilders";
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
  excludedResources: string[];
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
  excludedResources,
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
          getBulkRegionData(
            visibleRegions.map((r) => r.region_uid),
            !isDryRun
          ),
          getLandPools(),
        ]);
        const { sellOps, log, actions } = buildPostHarvestOps(
          visibleRegions,
          username,
          balances,
          pools,
          postHarvestStrategy,
          excludedResources
        );

        if (isDryRun) {
          return { title: "Dry Run — Process Resources", log };
        } else if (sellOps.length === 0) {
          setError(
            "No resources to process (all below minimum or strategy is accumulate)."
          );
        } else {
          // Phase 1: broadcast all sell ops (all at once, accepted Keychain batching limitation).
          const sellRes = await broadcastOperations(username, sellOps);
          if (!sellRes.success) {
            setError(sellRes.error ?? "Broadcast failed (sell phase)");
          } else {
            await waitForTransactions(sellRes.txIds, lookupTransaction);

            let allTxIds = sellRes.txIds;
            let liqFailed = false;

            if (postHarvestStrategy === "add_to_pool") {
              // Phase 2: re-fetch pools + balances after sells confirm.
              // Use 99% of the actual current balance (post-sell ~50%) as resource_amount
              // so there's always enough DEC to cover the spot-price ratio.
              const [{ pools: freshPools }, { balances: freshBalances }] =
                await Promise.all([
                  getLandPools(),
                  getBulkRegionData(
                    visibleRegions.map((r) => r.region_uid),
                    true
                  ),
                ]);
              const freshPoolMap = new Map(
                freshPools.map((p) => [
                  p.token_symbol,
                  {
                    decQty: parseFloat(p.dec_quantity),
                    resourceQty: parseFloat(p.resource_quantity),
                  },
                ])
              );

              // Collect the region+symbol pairs that were sold from the sell ops.
              const liquidityOps: [string, object][] = [];
              for (const sellOp of sellOps) {
                const envelope = sellOp[1] as { json: string };
                const op = JSON.parse(envelope.json) as {
                  region_uid: string;
                  resource_symbol: string;
                };
                const pool = freshPoolMap.get(op.resource_symbol);
                if (!pool || pool.resourceQty <= 0) continue;
                const freshAmount =
                  (freshBalances[op.region_uid]?.[op.resource_symbol] ?? 0) *
                  0.99;
                if (freshAmount <= 0) continue;
                const decAmount = parseFloat(
                  (freshAmount * (pool.decQty / pool.resourceQty)).toFixed(3)
                );
                if (decAmount <= 0) continue;
                liquidityOps.push(
                  buildAddLiquidityOp(
                    username,
                    op.region_uid,
                    op.resource_symbol,
                    parseFloat(freshAmount.toFixed(3)),
                    decAmount
                  )
                );
              }

              if (liquidityOps.length > 0) {
                const liqRes = await broadcastOperations(
                  username,
                  liquidityOps
                );
                if (!liqRes.success) {
                  setError(
                    liqRes.error ?? "Broadcast failed (add liquidity phase)"
                  );
                  liqFailed = true;
                } else {
                  await waitForTransactions(liqRes.txIds, lookupTransaction);
                  allTxIds = [...allTxIds, ...liqRes.txIds];
                }
              }
            }

            if (!liqFailed) {
              await recordPostHarvestLog(username, actions, allTxIds).catch(
                () => {}
              );
              setResult({ success: true, txIds: allTxIds });
              onSuccess?.();
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setBusy(false);
      }
      return null;
    },
    [
      username,
      visibleRegions,
      postHarvestStrategy,
      excludedResources,
      onSuccess,
    ]
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
