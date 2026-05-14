import {
  buildAddLiquidityOp,
  buildSellResourceForDecOp,
} from "@/lib/frontend/opBuilders";
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
  /** Phase 1: resource → DEC sells. Always present for sell_for_dec; also phase-1 of add_to_pool. */
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
  excludedResources: string[] = []
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

      if (strategy === "sell_for_dec") {
        const { out_amount_2: decOut } = computeResourceToDec(
          pools,
          symbol,
          amount
        );
        if (decOut <= 0) continue;
        sellOps.push(
          buildSellResourceForDecOp(
            username,
            region.region_uid,
            amount,
            decOut,
            symbol,
            50 // post-harvest sales can be more tolerant of slippage since they won't cause a failed harvest
          )
        );
        log.push(`[${region.name}] sell ${amount} ${symbol} → ${decOut} DEC`);
        actions.push({
          type: "sell_for_dec",
          region_uid: region.region_uid,
          symbol,
          resource_in: amount,
          dec_amount: decOut,
        });
      } else if (strategy === "add_to_pool") {
        const half = parseFloat((amount / 2).toFixed(3));
        const { out_amount_2: decOut } = computeResourceToDec(
          pools,
          symbol,
          half
        );
        if (decOut <= 0) continue;
        // Phase 1: sell half to DEC
        sellOps.push(
          buildSellResourceForDecOp(
            username,
            region.region_uid,
            half,
            decOut,
            symbol
          )
        );
        // Dry-run display: estimate liquidity op from pre-sell spot price.

        liquidityOps.push(
          buildAddLiquidityOp(username, region.region_uid, symbol, half, decOut)
        );
        log.push(
          `[${region.name}] add_to_pool ${half} ${symbol} + ${decOut} DEC (incl. sell ${half} ${symbol} → ${decOut} DEC)`
        );
        actions.push({
          type: "add_to_pool",
          region_uid: region.region_uid,
          symbol,
          resource_in: amount,
          dec_amount: decOut,
        });
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
