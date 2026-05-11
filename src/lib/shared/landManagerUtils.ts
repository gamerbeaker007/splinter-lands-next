import { FEE_EXEMPTIONS, SERVICE_FEE_RECIPIENT } from "@/types/landManager";
import { SplHarvestableResource } from "@/types/spl/landManager";
import {
  calculatePriceImpact,
  calculatePriceImpactInverse,
} from "@/lib/shared/priceUtils";
import { SplLandPool } from "@/types/spl/landPools";
import { TRADE_HUB_FEE } from "@/lib/shared/statics";
import { Resource } from "@/constants/resource/resource";

export interface CostEntry {
  symbol: Resource;
  amount: number;
}

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
// calculatePriceImpact already applies TRADE_HUB_FEE (0.9) to the output.
// For resource↔resource swaps we route through DEC (two hops → fee applied twice).

type SwapResult = { out_amount_1: number; out_amount_2: number };
const ZERO_RESULT: SwapResult = { out_amount_1: 0, out_amount_2: 0 };

const round3 = (value: number): number => Number.parseFloat(value.toFixed(3));

function poolFor(
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
// Fee is applied on hop 1 only — this is a single trade hub operation.
export function computeResourceToResource(
  pools: SplLandPool[],
  fromSymbol: string,
  toSymbol: string,
  resourceAmount: number
): SwapResult {
  const fromPool = poolFor(pools, fromSymbol);
  const toPool = poolFor(pools, toSymbol);
  if (!fromPool || !toPool) return ZERO_RESULT;

  const decOut = calculatePriceImpact(
    resourceAmount,
    Number.parseFloat(fromPool.resource_quantity),
    Number.parseFloat(fromPool.dec_quantity)
    // applyFee defaults to true — fee taken here
  ).amountReceived;

  const resourceOut = calculatePriceImpact(
    decOut,
    Number.parseFloat(toPool.dec_quantity),
    Number.parseFloat(toPool.resource_quantity),
    false // fee already applied on hop 1
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

export function shouldApplyFee(
  username: string,
  regionNumber: number
): boolean {
  if (username.toLowerCase() === SERVICE_FEE_RECIPIENT.toLowerCase())
    return false;
  return !FEE_EXEMPTIONS.some((e) => e.region_id === regionNumber);
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

  const decReserve = Number.parseFloat(pool.dec_quantity);
  const resourceReserve = Number.parseFloat(pool.resource_quantity);
  // Maximum extractable output (before we'd drain the pool):  rR * TRADE_HUB_FEE
  const maxOut = resourceReserve * TRADE_HUB_FEE;
  if (deficit >= maxOut) return Infinity;

  // Derived from: deficit = (rR - k/(dR + D)) * TRADE_HUB_FEE  →  solve for D
  // D = dR * deficit / (maxOut - deficit)
  const decNeeded = (decReserve * deficit) / (maxOut - deficit);
  return Number.parseFloat(decNeeded.toFixed(3));
}

/**
 * Inverse of computeSwapAmounts: given a desired output amount, return how much
 * input is needed. Returns Infinity when the pool cannot supply the output.
 *
 * Transfer (same symbol): invert 10% fee → in = out / TRADE_HUB_FEE
 * DEC → resource:         invert AMM + fee (hop 1 of buy_dec path)
 * resource → resource:    invert two hops — hop 2 (no fee) then hop 1 (with fee)
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

  // resource → DEC (fee) → resource (no fee): two hops
  const fromPool = poolFor(pools, fromSymbol);
  const toPool = poolFor(pools, toSymbol);
  if (!fromPool || !toPool) return Infinity;

  // Invert hop 2 (DEC → toSymbol, no fee)
  const decMid = calculatePriceImpactInverse(
    desiredOut,
    Number.parseFloat(toPool.dec_quantity),
    Number.parseFloat(toPool.resource_quantity),
    false // hop 2 has no fee
  );
  if (!Number.isFinite(decMid)) return Infinity;

  // Invert hop 1 (fromSymbol → DEC, with fee)
  const fromIn = calculatePriceImpactInverse(
    decMid,
    Number.parseFloat(fromPool.resource_quantity),
    Number.parseFloat(fromPool.dec_quantity)
  );
  return Number.isFinite(fromIn)
    ? Number.parseFloat(fromIn.toFixed(3))
    : Infinity;
}
