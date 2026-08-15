import { aggregateCosts, poolFor } from "@/lib/shared/landManagerUtils";
import { NATURAL_RESOURCES, PRODUCING_RESOURCES } from "@/lib/shared/statics";
import {
  SplHarvestableResource,
  SplProductionOverviewRegion,
  SplRegionOverviewData,
} from "@/types/spl/landManager";
import { SplLandPool, SplPlayerPoolPosition } from "@/types/spl/landPools";

// ── Liquidity position math ──────────────────────────────────────────────────
//
// A player's stake in a resource pool is held as LP *shares*. The pool exposes
// `total_shares` alongside its `resource_quantity` / `dec_quantity`, so the
// player's underlying holdings are simply their proportional slice of both
// reserves.
//
// `remove_liquidity` does NOT take an absolute share count: `shares_out` is a
// fraction of the player's own position, where 1 = the entire position. That is
// also the unit the vesting lock is expressed in — the locked fraction is
// `VESTING-<RES> / DEC-<RES>` — which keeps every number here dimensionless.

/** A player's pool holdings expressed in resource and DEC units. */
export interface PoolHolding {
  symbol: string;
  /** Resource units represented by the player's full position. */
  resource: number;
  /** DEC represented by the player's full position. */
  dec: number;
  /** Fraction of the position (0..1) still inside the 30-day lock. */
  lockedFraction: number;
  /** Fraction of the position (0..1) withdrawable without the 10% penalty. */
  unlockedFraction: number;
  /** Resource units withdrawable without the 10% penalty. */
  unlockedResource: number;
  /** DEC withdrawable without the 10% penalty. */
  unlockedDec: number;
}

const EMPTY_HOLDING = (symbol: string): PoolHolding => ({
  symbol,
  resource: 0,
  dec: 0,
  lockedFraction: 0,
  unlockedFraction: 0,
  unlockedResource: 0,
  unlockedDec: 0,
});

/**
 * Convert an LP position into the resource/DEC it represents, split by the
 * 30-day vesting lock.
 */
export function computePoolHolding(
  position: SplPlayerPoolPosition | undefined,
  pools: SplLandPool[]
): PoolHolding {
  const symbol = position?.symbol ?? "";
  if (!position || position.shares <= 0) return EMPTY_HOLDING(symbol);

  const pool = poolFor(pools, symbol);
  if (!pool) return EMPTY_HOLDING(symbol);

  const totalShares = Number.parseFloat(pool.total_shares);
  if (!Number.isFinite(totalShares) || totalShares <= 0)
    return EMPTY_HOLDING(symbol);

  const share = position.shares / totalShares;
  const resource = share * Number.parseFloat(pool.resource_quantity);
  const dec = share * Number.parseFloat(pool.dec_quantity);

  const lockedFraction = Math.min(
    1,
    Math.max(0, position.vestingShares / position.shares)
  );
  const unlockedFraction = 1 - lockedFraction;

  return {
    symbol,
    resource,
    dec,
    lockedFraction,
    unlockedFraction,
    unlockedResource: resource * unlockedFraction,
    unlockedDec: dec * unlockedFraction,
  };
}

/**
 * The `shares_out` fraction that withdraws `resourceWanted` units, capped at
 * the unlocked portion so the withdrawal never triggers the 10% early-exit
 * penalty. Returns 0 when nothing can be withdrawn.
 *
 * `alreadyUsedFraction` lets a caller withdraw for several regions from the
 * same position within one plan without double-spending it.
 */
export function sharesFractionForResource(
  holding: PoolHolding,
  resourceWanted: number,
  alreadyUsedFraction = 0
): number {
  if (holding.resource <= 0 || resourceWanted <= 0) return 0;
  const remainingFraction = Math.max(
    0,
    holding.unlockedFraction - alreadyUsedFraction
  );
  if (remainingFraction <= 0) return 0;
  return Math.min(resourceWanted / holding.resource, remainingFraction);
}

// ── Weekly consumption ───────────────────────────────────────────────────────
//
// Consumption is read as a RATE, never inferred from how much has piled up since
// the last harvest. The intended flow is
//
//     Make Harvestable → Harvest → Top Up Pools
//
// so by the time Top Up Pools runs every region was just claimed and the accrued
// cost is ~0. Dividing that by ~0 elapsed hours yields nothing usable, which
// would make the action skip every resource in exactly the situation it exists
// for. The rates below are independent of harvest timing.

const HOURS_PER_WEEK = 7 * 24;
/** Cap on the accrual window: production stops accruing after 7 days. */
const MAX_ACCRUAL_HOURS = HOURS_PER_WEEK;
/** Below this, accrued totals are too small to cross-check a rate against. */
const MIN_ACCRUAL_HOURS = 6;

/**
 * What one region burns per hour, split by resource.
 *
 * Two independent costs make up the total:
 *
 *  - GRAIN feeds the workers. Every worksite row carries its own
 *    `grain_req_per_hour` (already net of the plot's food discounts), so the
 *    region's grain burn is just their sum. Unpowered plots produce nothing and
 *    are excluded.
 *  - WOOD/STONE/IRON are recipe inputs consumed by producing the advanced
 *    resources (SPS, RESEARCH, AURA). `resource_recipes` gives the input cost per
 *    unit produced, so the burn is the region's production rate for each of those
 *    resources multiplied by its recipe.
 */
export function regionConsumptionPerHour(
  overview: SplRegionOverviewData | null
): Record<string, number> {
  const perHour: Record<string, number> = Object.fromEntries(
    NATURAL_RESOURCES.map((s) => [s, 0])
  );
  if (!overview) return perHour;

  const basePP = Object.fromEntries(PRODUCING_RESOURCES.map((s) => [s, 0]));

  // always calculated the grain cost for every plot
  for (const plot of overview.plots ?? []) {
    if (!plot.is_powered || !plot.resource_symbol) continue;
    perHour.GRAIN += plot.grain_req_per_hour ?? 0;
    basePP[plot.resource_symbol] += plot.total_base_pp_after_cap;
  }

  // calculate the resource consumption for each recipe
  for (const [produced, recipe] of Object.entries(
    overview.resource_recipes ?? {}
  )) {
    const pp = basePP[produced] ?? 0;
    if (pp <= 0) continue;

    for (const input of recipe) {
      const cost = pp * input.qty;
      perHour[input.symbol] = (perHour[input.symbol] ?? 0) + cost;
    }
  }
  return perHour;
}

export interface WeeklyConsumption {
  /** symbol → resource units consumed per 7 days, summed across regions. */
  perResource: Record<string, number>;
  /** Notes worth surfacing in the plan (missing data, rate/accrual drift). */
  warnings: string[];
}

/**
 * Each resource's consumption over 7 days, summed across `regions`.
 *
 * Derived purely from live rates, so it is valid immediately after a harvest.
 * When a region has been accruing long enough to be a meaningful sample, the
 * accrued cost is used as an independent CROSS-CHECK: cost ÷ elapsed hours must
 * agree with the rate, and a material disagreement is surfaced rather than
 * silently trusted.
 */
export function computeWeeklyConsumption(
  regions: SplProductionOverviewRegion[],
  consumptionPerHour: Record<string, Record<string, number>>,
  harvestableMap: Record<string, SplHarvestableResource[]> = {},
  now: Date = new Date()
): WeeklyConsumption {
  const perResource: Record<string, number> = Object.fromEntries(
    NATURAL_RESOURCES.map((s) => [s, 0])
  );
  const warnings: string[] = [];

  for (const region of regions) {
    const rates = consumptionPerHour[region.region_uid];
    if (!rates) {
      warnings.push(
        `${region.name}: no production data — its consumption is not counted`
      );
      continue;
    }

    for (const symbol of NATURAL_RESOURCES) {
      perResource[symbol] += (rates[symbol] ?? 0) * HOURS_PER_WEEK;
    }

    const drift = accrualDrift(region, rates, harvestableMap, now);
    if (drift) warnings.push(`${region.name}: ${drift}`);
  }

  return { perResource, warnings };
}

/**
 * Compare the rate against the cost actually accrued since the last claim.
 * Returns a message when they disagree by more than 20%, or null when they
 * agree / the sample is too short to judge.
 */
function accrualDrift(
  region: SplProductionOverviewRegion,
  rates: Record<string, number>,
  harvestableMap: Record<string, SplHarvestableResource[]>,
  now: Date
): string | null {
  const costs = aggregateCosts(harvestableMap[region.region_uid] ?? []);
  if (costs.length === 0) return null;

  const lastClaimed = region.last_claimed
    ? new Date(region.last_claimed)
    : null;
  if (!lastClaimed || Number.isNaN(lastClaimed.getTime())) return null;

  const elapsedHours = Math.min(
    MAX_ACCRUAL_HOURS,
    (now.getTime() - lastClaimed.getTime()) / 3_600_000
  );
  if (elapsedHours < MIN_ACCRUAL_HOURS) return null;

  for (const { symbol, amount } of costs) {
    const measured = amount / elapsedHours;
    const rate = rates[symbol] ?? 0;
    if (measured <= 0 || rate <= 0) continue;
    const ratio = measured / rate;
    if (ratio > 1.2 || ratio < 0.8) {
      return (
        `${symbol} rate ${rate.toFixed(1)}/hr disagrees with the ${measured.toFixed(1)}/hr ` +
        `accrued over the last ${elapsedHours.toFixed(0)}h — target may be off`
      );
    }
  }
  return null;
}
