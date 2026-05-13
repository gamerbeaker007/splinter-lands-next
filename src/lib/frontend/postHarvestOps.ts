import {
  buildAddLiquidityOp,
  buildSwapTokensOp,
} from "@/lib/frontend/opBuilders";
import { computeResourceToDec } from "@/lib/shared/landManagerUtils";
import {
  PostHarvestActionSummary,
  PostHarvestStrategy,
} from "@/types/landManager";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import { SplLandPool } from "@/types/spl/landPools";

const MIN_RESOURCE = 1; // skip tiny amounts

export function buildPostHarvestOps(
  regions: SplProductionOverviewRegion[],
  username: string,
  balances: Record<string, Record<string, number>>, // region_uid → { GRAIN, WOOD, ... }
  pools: SplLandPool[],
  strategy: PostHarvestStrategy
): {
  ops: [string, object][];
  log: string[];
  actions: PostHarvestActionSummary[];
} {
  if (strategy === "accumulate") return { ops: [], log: [], actions: [] };

  const ops: [string, object][] = [];
  const log: string[] = [];
  const actions: PostHarvestActionSummary[] = [];

  for (const region of regions) {
    const balance = balances[region.region_uid] ?? {};
    for (const [symbol, amount] of Object.entries(balance)) {
      if (amount < MIN_RESOURCE) continue;

      if (strategy === "sell_for_dec") {
        const { out_amount_2: decOut } = computeResourceToDec(
          pools,
          symbol,
          amount
        );
        if (decOut <= 0) continue;
        ops.push(
          buildSwapTokensOp({
            username,
            fromRegionUid: region.region_uid,
            toRegionUid: region.region_uid,
            fromSymbol: symbol,
            toSymbol: "DEC",
            inAmount: amount,
            outAmount1: 0,
            outAmount2: decOut,
          })
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
        // Swap half to DEC
        ops.push(
          buildSwapTokensOp({
            username,
            fromRegionUid: region.region_uid,
            toRegionUid: region.region_uid,
            fromSymbol: symbol,
            toSymbol: "DEC",
            inAmount: half,
            outAmount1: 0,
            outAmount2: decOut,
          })
        );
        // Add remaining half + DEC to pool
        ops.push(
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

  return { ops, log, actions };
}
