"use client";

import { recordPostHarvestLog } from "@/lib/backend/actions/land-manager/log-actions";
import {
  getBulkRegionData,
  getDecBalance,
  getLandPools,
  getPlayerPoolPositions,
  invalidatePlayerRegionCaches,
} from "@/lib/backend/actions/land-manager/overview-actions";
import { formatNumber } from "@/lib/formatters";
import { validateCustomPlan } from "@/lib/shared/customPlanValidation";
import {
  computeDecNeededForResource,
  computeSwapAmounts,
} from "@/lib/shared/landManagerUtils";
import {
  computePoolHolding,
  sharesFractionForResource,
} from "@/lib/shared/poolPositionUtils";
import {
  buildAddLiquidityOp,
  buildBuyWithDecOp,
  buildRemoveLiquidityOp,
  buildSellResourceForDecOp,
  buildSwapTokensOp,
} from "@/lib/shared/operations/opBuilders";
import { NATURAL_RESOURCES } from "@/lib/shared/statics";
import {
  BroadcastResult,
  broadcastOperations,
  waitForTransactions,
} from "@/lib/frontend/splBroadcast";
import { MAX_OPS_PER_BROADCAST } from "@/types/landManager";
import type {
  ActionPlan,
  CustomPlanRowDraft,
  PostHarvestActionSummary,
} from "@/types/landManager";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import { useCallback, useState } from "react";

interface Params {
  username: string;
  visibleRegions: SplProductionOverviewRegion[];
  onSuccess?: () => void;
}

interface UseCustomPlanAction {
  busy: boolean;
  result: BroadcastResult | null;
  error: string | null;
  clearResult: () => void;
  clearError: () => void;
  execute: (
    rows: CustomPlanRowDraft[],
    planOnly: boolean,
    multiplier?: number
  ) => Promise<ActionPlan | null>;
}

export function useCustomPlanAction({
  username,
  visibleRegions,
  onSuccess,
}: Params): UseCustomPlanAction {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<BroadcastResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (
      rows: CustomPlanRowDraft[],
      planOnly: boolean,
      multiplier = 1
    ): Promise<ActionPlan | null> => {
      setBusy(true);
      setError(null);
      setResult(null);

      try {
        const enabledRegionUids = visibleRegions.map((r) => r.region_uid);

        const [{ balances }, { pools }, decBalance, poolPositions] =
          await Promise.all([
            getBulkRegionData(enabledRegionUids, true),
            getLandPools(),
            getDecBalance(username),
            getPlayerPoolPositions(username, NATURAL_RESOURCES, true),
          ]);

        const configuredRows = rows.filter((r) => r.action_type);
        const validation = validateCustomPlan(
          configuredRows,
          balances,
          decBalance,
          pools,
          { multiplier, poolPositions }
        );

        if (validation.status !== "valid") {
          setError(
            "Plan is not valid. Please fix all row errors before executing."
          );
          setBusy(false);
          return null;
        }

        const ops: [string, object][] = [];
        const actions: PostHarvestActionSummary[] = [];
        const log: string[] = [];

        if (Math.abs(multiplier - 1) > 1e-9) {
          log.push(`Multiplier: x${multiplier}`);
        }

        const totalBroadcasts = Math.ceil(
          configuredRows.length / MAX_OPS_PER_BROADCAST
        );
        if (totalBroadcasts > 1) {
          log.push(
            `This plan will require ${totalBroadcasts} Keychain signatures.`
          );
        }

        const usedPoolFractions = new Map<string, number>();

        for (let i = 0; i < configuredRows.length; i++) {
          const draft = configuredRows[i];
          const rowResult = validation.rows[i];
          if (!rowResult || !rowResult.valid) continue;

          const resolvedAmount = rowResult.resolvedAmount;

          switch (draft.action_type) {
            case "transfer": {
              const out = computeSwapAmounts(
                pools,
                draft.from_resource,
                draft.from_resource,
                resolvedAmount
              );
              ops.push(
                buildSwapTokensOp({
                  username,
                  fromRegionUid: draft.from_region_uid,
                  toRegionUid: draft.to_region_uid,
                  fromSymbol: draft.from_resource,
                  toSymbol: draft.from_resource,
                  inAmount: resolvedAmount,
                  outAmount1: 0,
                  outAmount2: out.out_amount_2,
                })
              );
              actions.push({
                type: "transfer",
                region_uid: draft.from_region_uid,
                to_region_uid: draft.to_region_uid,
                symbol: draft.from_resource,
                resource_amount: resolvedAmount,
                dec_amount: 0,
                to_symbol: draft.from_resource,
                to_resource_amount: out.out_amount_2,
              });
              log.push(
                `Transfer ${formatNumber(resolvedAmount)} ${draft.from_resource} from ${draft.from_region_uid} to ${draft.to_region_uid} (~${formatNumber(out.out_amount_2, { maximumFractionDigits: 0 })} received)`
              );
              break;
            }

            case "pool": {
              const decNeeded = computeDecNeededForResource(
                pools,
                draft.from_resource,
                resolvedAmount
              );
              ops.push(
                buildAddLiquidityOp(
                  username,
                  draft.from_region_uid,
                  draft.from_resource,
                  resolvedAmount,
                  decNeeded
                )
              );
              actions.push({
                type: "add_to_pool",
                region_uid: draft.from_region_uid,
                symbol: draft.from_resource,
                resource_amount: resolvedAmount,
                dec_amount: decNeeded,
              });
              log.push(
                `Pool ${formatNumber(resolvedAmount)} ${draft.from_resource} in ${draft.from_region_uid} (~${formatNumber(decNeeded, { maximumFractionDigits: 0 })} DEC)`
              );
              break;
            }

            case "buy": {
              const decNeeded = computeDecNeededForResource(
                pools,
                draft.from_resource,
                resolvedAmount
              );
              ops.push(
                buildBuyWithDecOp(
                  username,
                  draft.to_region_uid,
                  decNeeded,
                  0,
                  draft.from_resource
                )
              );
              actions.push({
                type: "buy_resource",
                region_uid: draft.to_region_uid,
                symbol: draft.from_resource,
                resource_amount: resolvedAmount,
                dec_amount: decNeeded,
              });
              log.push(
                `Buy ${formatNumber(resolvedAmount)} ${draft.from_resource} into ${draft.to_region_uid} (~${formatNumber(decNeeded, { maximumFractionDigits: 0 })} DEC)`
              );
              break;
            }

            case "sell": {
              const out = computeSwapAmounts(
                pools,
                draft.from_resource,
                "DEC",
                resolvedAmount
              );
              ops.push(
                buildSellResourceForDecOp(
                  username,
                  draft.from_region_uid,
                  resolvedAmount,
                  0,
                  draft.from_resource
                )
              );
              actions.push({
                type: "sell_for_dec",
                region_uid: draft.from_region_uid,
                symbol: draft.from_resource,
                resource_amount: resolvedAmount,
                dec_amount: out.out_amount_2,
              });
              log.push(
                `Sell ${formatNumber(resolvedAmount)} ${draft.from_resource} from ${draft.from_region_uid} (~${formatNumber(out.out_amount_2, { maximumFractionDigits: 0 })} DEC)`
              );
              break;
            }

            case "swap": {
              const out = computeSwapAmounts(
                pools,
                draft.from_resource,
                draft.to_resource,
                resolvedAmount
              );
              ops.push(
                buildSwapTokensOp({
                  username,
                  fromRegionUid: draft.from_region_uid,
                  toRegionUid: draft.to_region_uid,
                  fromSymbol: draft.from_resource,
                  toSymbol: draft.to_resource,
                  inAmount: resolvedAmount,
                  outAmount1: out.out_amount_1,
                  outAmount2: out.out_amount_2,
                })
              );
              actions.push({
                type: "swap_resource",
                region_uid: draft.from_region_uid,
                to_region_uid: draft.to_region_uid,
                symbol: draft.from_resource,
                resource_amount: resolvedAmount,
                dec_amount: out.out_amount_1,
                to_symbol: draft.to_resource,
                to_resource_amount: out.out_amount_2,
              });
              log.push(
                `Swap ${formatNumber(resolvedAmount)} ${draft.from_resource} in ${draft.from_region_uid} to ${draft.to_resource} in ${draft.to_region_uid} (~${formatNumber(out.out_amount_2, { maximumFractionDigits: 0 })})`
              );
              break;
            }

            case "pool_withdraw": {
              const symbol = draft.from_resource;
              const holding = computePoolHolding(poolPositions[symbol], pools);
              const used = usedPoolFractions.get(symbol) ?? 0;
              const fraction = sharesFractionForResource(
                holding,
                resolvedAmount,
                used
              );
              if (fraction <= 0) {
                throw new Error(
                  `No unlocked ${symbol} liquidity available for withdrawal`
                );
              }
              const sharesOut = Number.parseFloat(fraction.toFixed(3));
              if (sharesOut < 0.001) {
                throw new Error(
                  `Withdrawal for ${symbol} is too small for chain precision`
                );
              }
              usedPoolFractions.set(symbol, used + fraction);
              const resourceOut = holding.resource * fraction;
              const decOut = holding.dec * fraction;
              ops.push(
                buildRemoveLiquidityOp(
                  username,
                  draft.to_region_uid,
                  symbol,
                  sharesOut
                )
              );
              actions.push({
                type: "remove_from_pool",
                region_uid: draft.to_region_uid,
                symbol,
                resource_amount: resourceOut,
                dec_amount: decOut,
              });
              log.push(
                `Withdraw pool ${symbol} into ${draft.to_region_uid} (~${formatNumber(resourceOut, { maximumFractionDigits: 0 })} ${symbol} + ~${formatNumber(decOut, { maximumFractionDigits: 0 })} DEC)`
              );
              break;
            }
          }
        }

        if (ops.length === 0) {
          setError("No operations to execute");
          setBusy(false);
          return null;
        }

        const plan: ActionPlan = {
          title: `Custom Plan - ${ops.length} operation${ops.length > 1 ? "s" : ""}`,
          log,
        };

        if (planOnly) {
          setBusy(false);
          return plan;
        }

        const broadcastResult = await broadcastOperations(username, ops);
        setResult(broadcastResult);

        if (broadcastResult.txIds.length > 0) {
          await waitForTransactions(broadcastResult.txIds);
          await recordPostHarvestLog(username, actions, broadcastResult.txIds);
        }

        await invalidatePlayerRegionCaches();

        if (broadcastResult.success) {
          onSuccess?.();
        }

        return plan;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setError(msg);
        await invalidatePlayerRegionCaches();
        return null;
      } finally {
        setBusy(false);
      }
    },
    [username, visibleRegions, onSuccess]
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
