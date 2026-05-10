import {
  HarvestableResource,
  RegionResourceBalance,
  TRADE_HUB_FEE_PCT,
} from "@/types/landManager";
import { calculatePriceImpact } from "@/lib/shared/priceUtils";
import { SplLandPool } from "@/types/spl/landPools";

export const NATURAL_RESOURCES = new Set(["GRAIN", "WOOD", "STONE", "IRON"]);

export interface CostEntry {
  symbol: string;
  amount: number;
}

export function aggregateCosts(resources: HarvestableResource[]): CostEntry[] {
  const totals: Record<string, number> = {
    GRAIN: resources.reduce((s, r) => s + r.grain_required_for_food, 0),
    WOOD: resources.reduce((s, r) => s + r.wood_required, 0),
    STONE: resources.reduce((s, r) => s + r.stone_required, 0),
    IRON: resources.reduce((s, r) => s + r.iron_required, 0),
  };
  return Object.entries(totals)
    .filter(([, v]) => v > 0)
    .map(([symbol, amount]) => ({ symbol, amount }));
}

export function computeEffectiveBalances(
  regionBalance: RegionResourceBalance,
  harvestable: HarvestableResource[]
): Record<string, number> {
  const incoming: Record<string, number> = {
    GRAIN: 0,
    WOOD: 0,
    STONE: 0,
    IRON: 0,
  };
  for (const r of harvestable) {
    if (NATURAL_RESOURCES.has(r.token_symbol)) {
      incoming[r.token_symbol] =
        (incoming[r.token_symbol] ?? 0) + r.amount_claimable;
    }
  }
  return {
    GRAIN: regionBalance.grain + incoming.GRAIN,
    WOOD: regionBalance.wood + incoming.WOOD,
    STONE: regionBalance.stone + incoming.STONE,
    IRON: regionBalance.iron + incoming.IRON,
    AURA: regionBalance.aura,
  };
}

export function canHarvestRegion(
  harvestable: HarvestableResource[],
  regionBalance: RegionResourceBalance
): boolean {
  const costs = aggregateCosts(harvestable);
  if (costs.length === 0) return false;
  const eff = computeEffectiveBalances(regionBalance, harvestable);
  return costs.every(({ symbol, amount }) => (eff[symbol] ?? 0) >= amount);
}

// ── Pool-based AMM quote utilities ────────────────────────────────────────
//
// All resource↔DEC pools use a constant-product AMM: x * y = k.
// calculatePriceImpact already applies TRADE_HUB_FEE (0.9) to the output.
// For resource↔resource swaps we route through DEC (two hops → fee applied twice).

const FEE_MULT = 1 - TRADE_HUB_FEE_PCT / 100; // 0.90

function poolFor(
  pools: SplLandPool[],
  symbol: string
): SplLandPool | undefined {
  return pools.find((p) => p.token_symbol === symbol);
}

/**
 * Compute AMM output amounts for a trade hub operation.
 *
 * - Same symbol (transfer):  no AMM, just 10% fee on the received side.
 * - DEC → resource:           single hop (DEC reserve → resource reserve).
 * - resource → DEC:           single hop.
 * - resource → resource:      two hops via DEC.
 *
 * Returns `{ out_amount_1, out_amount_2 }` matching the swap_tokens op fields:
 *   out_amount_1 = intermediate DEC (0 for same-symbol or DEC trades)
 *   out_amount_2 = final output amount
 */
export function computeSwapAmounts(
  pools: SplLandPool[],
  fromSymbol: string,
  toSymbol: string,
  amount: number
): { out_amount_1: number; out_amount_2: number } {
  // Same symbol: pure cross-region transfer, trade hub takes 10%
  if (fromSymbol === toSymbol) {
    return {
      out_amount_1: 0,
      out_amount_2: parseFloat((amount * FEE_MULT).toFixed(3)),
    };
  }

  // DEC → resource
  if (fromSymbol === "DEC") {
    const pool = poolFor(pools, toSymbol);
    if (!pool) return { out_amount_1: 0, out_amount_2: 0 };
    const resourceOut = calculatePriceImpact(
      amount,
      parseFloat(pool.dec_quantity),
      parseFloat(pool.resource_quantity)
    ).amountReceived;
    return {
      out_amount_1: 0,
      out_amount_2: parseFloat(resourceOut.toFixed(3)),
    };
  }

  // resource → DEC
  if (toSymbol === "DEC") {
    const pool = poolFor(pools, fromSymbol);
    if (!pool) return { out_amount_1: 0, out_amount_2: 0 };
    const decOut = calculatePriceImpact(
      amount,
      parseFloat(pool.resource_quantity),
      parseFloat(pool.dec_quantity)
    ).amountReceived;
    return { out_amount_1: 0, out_amount_2: parseFloat(decOut.toFixed(3)) };
  }

  // resource → resource (two hops: fromSymbol → DEC → toSymbol)
  const fromPool = poolFor(pools, fromSymbol);
  const toPool = poolFor(pools, toSymbol);
  if (!fromPool || !toPool) return { out_amount_1: 0, out_amount_2: 0 };

  const decOut = calculatePriceImpact(
    amount,
    parseFloat(fromPool.resource_quantity),
    parseFloat(fromPool.dec_quantity)
  ).amountReceived;

  const resourceOut = calculatePriceImpact(
    decOut,
    parseFloat(toPool.dec_quantity),
    parseFloat(toPool.resource_quantity)
  ).amountReceived;

  return {
    out_amount_1: parseFloat(decOut.toFixed(3)),
    out_amount_2: parseFloat(resourceOut.toFixed(3)),
  };
}

/**
 * Compute how much DEC is needed to purchase `deficit` units of `resourceSymbol`
 * from the trade hub pool (accounting for AMM price impact and the 10% fee).
 *
 * Returns `Infinity` when the pool cannot supply the required amount.
 */
export function computeDecNeededForResource(
  pools: SplLandPool[],
  resourceSymbol: string,
  deficit: number
): number {
  const pool = poolFor(pools, resourceSymbol);
  if (!pool) return Infinity;

  const decReserve = parseFloat(pool.dec_quantity);
  const resourceReserve = parseFloat(pool.resource_quantity);
  // Maximum extractable output (before we'd drain the pool):  rR * feeMult
  const maxOut = resourceReserve * FEE_MULT;
  if (deficit >= maxOut) return Infinity;

  // Derived from: deficit = (rR - k/(dR + D)) * feeMult  →  solve for D
  // D = dR * deficit / (maxOut - deficit)
  const decNeeded = (decReserve * deficit) / (maxOut - deficit);
  return parseFloat(decNeeded.toFixed(3));
}
