import { Resource } from "@/constants/resource/resource";
import {
  calculatePriceImpact,
  calculatePriceImpactInverse,
} from "@/lib/shared/priceUtils";
import { TRADE_HUB_FEE, TRADE_HUB_FEE_PER_HOP } from "@/lib/shared/statics";
import { SplHarvestableResource } from "@/types/spl/landManager";
import { SplLandPool } from "@/types/spl/landPools";

export interface CostEntry {
  symbol: Resource;
  amount: number;
}

/** Zeroed natural-resource balance, used as a fallback for regions with no data. */
export const EMPTY_BALANCE: Record<string, number> = {
  GRAIN: 0,
  WOOD: 0,
  STONE: 0,
  IRON: 0,
  AURA: 0,
};

export function aggregateCosts(
  resources: SplHarvestableResource[]
): CostEntry[] {
  const totals: Partial<Record<Resource, number>> = {
    GRAIN: resources.reduce((s, r) => s + r.grain_required_for_food, 0),
    WOOD: resources.reduce((s, r) => s + r.wood_required, 0),
    STONE: resources.reduce((s, r) => s + r.stone_required, 0),
    IRON: resources.reduce((s, r) => s + r.iron_required, 0),
  };
  return (Object.entries(totals) as Array<[Resource, number | undefined]>)
    .filter((entry): entry is [Resource, number] => (entry[1] ?? 0) > 0)
    .map(([symbol, amount]) => ({ symbol, amount }));
}

// Effective balance = stored region balance + natural resources ready to harvest.
// Natural resources (GRAIN, WOOD, STONE, IRON) are processed first by Splinterlands,
// so their ready amounts are immediately available to cover costs in the same harvest.
// Ready amounts come from the production overview (*_ready fields), not the harvestable API.
export function effectiveBalance(
  balance: Record<string, number>,
  region: {
    grain_ready: number;
    wood_ready: number;
    stone_ready: number;
    iron_ready: number;
  }
): Record<string, number> {
  return {
    GRAIN: (balance["GRAIN"] ?? 0) + region.grain_ready,
    WOOD: (balance["WOOD"] ?? 0) + region.wood_ready,
    STONE: (balance["STONE"] ?? 0) + region.stone_ready,
    IRON: (balance["IRON"] ?? 0) + region.iron_ready,
  };
}

export function canHarvestRegion(
  harvestable: SplHarvestableResource[],
  balance: Record<string, number>
): boolean {
  const costs = aggregateCosts(harvestable);
  if (costs.length === 0) return false;
  return costs.every(({ symbol, amount }) => (balance[symbol] ?? 0) >= amount);
}

// ── Pool-based AMM quote utilities ────────────────────────────────────────
//
// All resource↔DEC pools use a constant-product AMM: x * y = k.
// Single-hop ops (same-symbol transfer, single AMM swap) use TRADE_HUB_FEE (0.9 = 10%).
// 2-hop resource↔resource swaps route through DEC and pay TRADE_HUB_FEE_PER_HOP (0.95 = 5%)
// on EACH hop, for a total fee of ~9.75%.

type SwapResult = { out_amount_1: number; out_amount_2: number };
const ZERO_RESULT: SwapResult = { out_amount_1: 0, out_amount_2: 0 };

const round3 = (value: number): number => Number.parseFloat(value.toFixed(3));

export function poolFor(
  pools: SplLandPool[],
  symbol: string
): SplLandPool | undefined {
  return pools.find((p) => p.token_symbol === symbol);
}

// Same-resource cross-region transfer — trade hub fee only, no AMM.
export function computeSameResourceTransfer(amount: number): SwapResult {
  return { out_amount_1: 0, out_amount_2: round3(amount * TRADE_HUB_FEE) };
}

// Single AMM hop: DEC in, resource out.
export function computeDecToResource(
  pools: SplLandPool[],
  toSymbol: string,
  decAmount: number
): SwapResult {
  const pool = poolFor(pools, toSymbol);
  if (!pool) return ZERO_RESULT;
  const resourceOut = calculatePriceImpact(
    decAmount,
    Number.parseFloat(pool.dec_quantity),
    Number.parseFloat(pool.resource_quantity)
  ).amountReceived;
  return { out_amount_1: 0, out_amount_2: round3(resourceOut) };
}

// Single AMM hop: resource in, DEC out.
export function computeResourceToDec(
  pools: SplLandPool[],
  fromSymbol: string,
  resourceAmount: number
): SwapResult {
  const pool = poolFor(pools, fromSymbol);
  if (!pool) return ZERO_RESULT;
  const decOut = calculatePriceImpact(
    resourceAmount,
    Number.parseFloat(pool.resource_quantity),
    Number.parseFloat(pool.dec_quantity)
  ).amountReceived;
  return { out_amount_1: 0, out_amount_2: round3(decOut) };
}

// Two AMM hops: resource → DEC → resource.
// Each hop pays TRADE_HUB_FEE_PER_HOP (5%). Total fee ≈ 9.75%.
// out_amount_1 = DEC received after hop-1 fee; out_amount_2 = resource received after hop-2 fee.
// These are minimum-output guarantees; the engine aborts if actual output < declared.
export function computeResourceToResource(
  pools: SplLandPool[],
  fromSymbol: string,
  toSymbol: string,
  resourceAmount: number
): SwapResult {
  const fromPool = poolFor(pools, fromSymbol);
  const toPool = poolFor(pools, toSymbol);
  if (!fromPool || !toPool) return ZERO_RESULT;

  // Hop 1: resource → DEC (5% fee).
  const decOut = calculatePriceImpact(
    resourceAmount,
    Number.parseFloat(fromPool.resource_quantity),
    Number.parseFloat(fromPool.dec_quantity),
    TRADE_HUB_FEE_PER_HOP
  ).amountReceived;

  // Hop 2: DEC → resource (5% fee).
  const resourceOut = calculatePriceImpact(
    decOut,
    Number.parseFloat(toPool.dec_quantity),
    Number.parseFloat(toPool.resource_quantity),
    TRADE_HUB_FEE_PER_HOP
  ).amountReceived;

  return { out_amount_1: round3(decOut), out_amount_2: round3(resourceOut) };
}

export function computeSwapAmounts(
  pools: SplLandPool[],
  fromSymbol: string,
  toSymbol: string,
  amount: number
): SwapResult {
  if (fromSymbol === toSymbol) return computeSameResourceTransfer(amount);
  if (fromSymbol === "DEC")
    return computeDecToResource(pools, toSymbol, amount);
  if (toSymbol === "DEC")
    return computeResourceToDec(pools, fromSymbol, amount);
  return computeResourceToResource(pools, fromSymbol, toSymbol, amount);
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
  const result = calculatePriceImpactInverse(
    deficit,
    Number.parseFloat(pool.dec_quantity),
    Number.parseFloat(pool.resource_quantity)
  );
  return Number.isFinite(result)
    ? Number.parseFloat(result.toFixed(3))
    : Infinity;
}

/**
 * Inverse of computeSwapAmounts: given a desired output amount, return how much
 * input is needed. Returns Infinity when the pool cannot supply the output.
 *
 * Transfer (same symbol): invert 10% fee → in = out / TRADE_HUB_FEE
 * DEC → resource:         invert AMM + 10% fee (single-hop)
 * resource → resource:    invert two hops, each paying TRADE_HUB_FEE_PER_HOP (5%)
 */
export function computeInputForDesiredOutput(
  pools: SplLandPool[],
  fromSymbol: string,
  toSymbol: string,
  desiredOut: number
): number {
  if (fromSymbol === toSymbol) {
    return desiredOut / TRADE_HUB_FEE;
  }

  if (fromSymbol === "DEC") {
    return computeDecNeededForResource(pools, toSymbol, desiredOut);
  }

  if (toSymbol === "DEC") {
    const pool = poolFor(pools, fromSymbol);
    if (!pool) return Infinity;
    const result = calculatePriceImpactInverse(
      desiredOut,
      Number.parseFloat(pool.resource_quantity), // input reserve
      Number.parseFloat(pool.dec_quantity) // output reserve
    );
    return Number.isFinite(result)
      ? Number.parseFloat(result.toFixed(3))
      : Infinity;
  }

  // resource → DEC → resource: two hops, 5% fee on each
  const fromPool = poolFor(pools, fromSymbol);
  const toPool = poolFor(pools, toSymbol);
  if (!fromPool || !toPool) return Infinity;

  // Invert hop 2 (DEC → toSymbol, 5% fee)
  const decMid = calculatePriceImpactInverse(
    desiredOut,
    Number.parseFloat(toPool.dec_quantity),
    Number.parseFloat(toPool.resource_quantity),
    TRADE_HUB_FEE_PER_HOP
  );
  if (!Number.isFinite(decMid)) return Infinity;

  // Invert hop 1 (fromSymbol → DEC, 5% fee)
  const fromIn = calculatePriceImpactInverse(
    decMid,
    Number.parseFloat(fromPool.resource_quantity),
    Number.parseFloat(fromPool.dec_quantity),
    TRADE_HUB_FEE_PER_HOP
  );
  return Number.isFinite(fromIn)
    ? Number.parseFloat(fromIn.toFixed(3))
    : Infinity;
}
