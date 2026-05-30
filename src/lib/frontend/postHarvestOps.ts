import {
  buildAddLiquidityOp,
  buildSellResourceForDecOp,
} from "@/lib/shared/operations/opBuilders";
import { computeResourceToDec } from "@/lib/shared/landManagerUtils";
import {
  PostHarvestActionSummary,
  PostHarvestStrategy,
} from "@/types/landManager";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import { SplLandPool } from "@/types/spl/landPools";
import { NATURAL_RESOURCES } from "../shared/statics";

const MIN_RESOURCE = 10; // skip tiny amounts
const NATURAL_RESOURCE_SET = new Set<string>(NATURAL_RESOURCES);

export interface PostHarvestOpsResult {
  /** All ops in execution order (sell phase then liquidity phase). Used for dry-run display. */
  ops: [string, object][];
  /** Phase 1: resource → DEC sells. Phase-1 of add_to_pool and sell portion of sell_and_pool. */
  sellOps: [string, object][];
  /**
   * Phase 2: add_liquidity ops estimated from PRE-SELL pool spot prices.
   * Used for dry-run display only. Live execution builds these from actual sell tx results.
   */
  liquidityOps: [string, object][];
  log: string[];
  actions: PostHarvestActionSummary[];
}

export function buildPostHarvestOps(
  regions: SplProductionOverviewRegion[],
  username: string,
  balances: Record<string, Record<string, number>>, // region_uid → { GRAIN, WOOD, ... }
  pools: SplLandPool[],
  strategy: PostHarvestStrategy,
  excludedResources: string[] = [],
  sellPct: number = 0,
  poolPct: number = 100
): PostHarvestOpsResult {
  if (strategy === "accumulate")
    return {
      ops: [],
      sellOps: [],
      liquidityOps: [],
      log: [],
      actions: [],
    };

  const excludedSet = new Set(excludedResources);
  const sellOps: [string, object][] = [];
  const liquidityOps: [string, object][] = [];
  const log: string[] = [];
  const actions: PostHarvestActionSummary[] = [];

  for (const region of regions) {
    const balance = balances[region.region_uid] ?? {};
    for (const [symbol, amount] of Object.entries(balance)) {
      // Only process natural resources; skip TAX and any user-excluded resources
      if (!NATURAL_RESOURCE_SET.has(symbol)) continue;
      if (excludedSet.has(symbol)) continue;
      if (amount < MIN_RESOURCE) continue;

      if (strategy === "sell_and_pool") {
        // Sell portion
        const sellAmount = Number.parseFloat(
          ((amount * sellPct) / 100).toFixed(3)
        );
        if (sellAmount >= MIN_RESOURCE) {
          const { out_amount_2: decOut } = computeResourceToDec(
            pools,
            symbol,
            sellAmount
          );
          if (decOut > 0) {
            sellOps.push(
              buildSellResourceForDecOp(
                username,
                region.region_uid,
                sellAmount,
                decOut,
                symbol,
                50
              )
            );
            log.push(
              `[${region.name}] sell ${sellAmount} ${symbol} → ${decOut} DEC (${sellPct}%)`
            );
            actions.push({
              type: "sell_for_dec",
              region_uid: region.region_uid,
              symbol,
              resource_in: sellAmount,
              dec_amount: decOut,
            });
          }
        }

        // Pool portion — DEC comes from wallet, not from selling
        const poolAmount = Number.parseFloat(
          ((amount * poolPct) / 100).toFixed(3)
        );
        if (poolAmount >= MIN_RESOURCE) {
          const pool = pools.find((p) => p.token_symbol === symbol);
          if (pool) {
            const decQty = Number.parseFloat(pool.dec_quantity);
            const resourceQty = Number.parseFloat(pool.resource_quantity);
            if (resourceQty > 0) {
              const decNeeded = Number.parseFloat(
                (poolAmount * (decQty / resourceQty)).toFixed(3)
              );
              if (decNeeded > 0) {
                liquidityOps.push(
                  buildAddLiquidityOp(
                    username,
                    region.region_uid,
                    symbol,
                    poolAmount,
                    decNeeded
                  )
                );
                log.push(
                  `[${region.name}] add_to_pool ${poolAmount} ${symbol} + ${decNeeded} DEC (${poolPct}%)`
                );
                actions.push({
                  type: "add_to_pool",
                  region_uid: region.region_uid,
                  symbol,
                  resource_in: poolAmount,
                  dec_amount: decNeeded,
                });
              }
            }
          }
        }
      }
    }
  }

  return {
    ops: [...sellOps, ...liquidityOps],
    sellOps,
    liquidityOps,
    log,
    actions,
  };
}
