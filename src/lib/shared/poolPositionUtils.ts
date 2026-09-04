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

// ── shares_out precision ─────────────────────────────────────────────────────
//
// !!! TEMPORARY EXPERIMENT !!!
//
// `shares_out` was assumed to be read with 3 decimals, which puts a floor of
// 0.001 (0.1% of the position) under every withdrawal. This is raised to 5 to
// find out whether the engine actually accepts a finer fraction — a 0.00001
// (0.001%) withdrawal.
//
// To revert: set SHARES_OUT_DECIMALS back to 3. Nothing else needs touching.
//
// Scope: this knob currently drives the Custom Plan withdrawal path only.
// `makeHarvestableOps` deliberately keeps its own 3-decimal rounding so the
// automated harvest flow is not part of the experiment.
export const SHARES_OUT_DECIMALS = 3;

/** Smallest `shares_out` the chain is assumed to accept. */
export const MIN_SHARES_OUT = 10 ** -SHARES_OUT_DECIMALS;

/**
 * Truncate a shares fraction to the precision the chain reads.
 *
 * Rounding DOWN matters: rounding up could push the withdrawal past the
 * unlocked slice and trigger the 10% early-exit penalty. The `toFixed` pass
 * only strips binary-float noise (0.12345000000000001) — the value is already
 * truncated, so it cannot round back up.
 */
export function floorSharesOut(fraction: number): number {
  const factor = 10 ** SHARES_OUT_DECIMALS;
  return Number(
    (Math.floor(fraction * factor) / factor).toFixed(SHARES_OUT_DECIMALS)
  );
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

// ── Consumption, production and external need ────────────────────────────────
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
//
// Three distinct quantities are kept apart on purpose:
//
//   consumedPerHour     what the region burns (gross)
//   producedPerHour     what the region makes of that itself
//   externalNeedPerHour max(0, consumed - produced) — what must come from outside
//
// Only the last one drives pool top-ups: a region that grows most of its own
// grain does not need the whole burn deposited on its behalf.

/** Production hours assumed in one week when no measured figure is supplied. */
export const HOURS_PER_WEEK = 7 * 24;
/** Cap on the accrual window: production stops accruing after 7 days. */
const MAX_ACCRUAL_HOURS = HOURS_PER_WEEK;
/** Below this, accrued totals are too small to cross-check a rate against. */
const MIN_ACCRUAL_HOURS = 6;

const zeroedNaturals = (): Record<string, number> =>
  Object.fromEntries(NATURAL_RESOURCES.map((s) => [s, 0]));

/**
 * GROSS consumption: what one region burns per hour, split by resource.
 *
 * Production is deliberately NOT subtracted here — see
 * {@link computeRegionResourceBalance} for the net external need.
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
  const perHour: Record<string, number> = zeroedNaturals();
  if (!overview) return perHour;

  const basePP: Record<string, number> = Object.fromEntries(
    PRODUCING_RESOURCES.map((s) => [s, 0])
  );

  for (const plot of overview.plots ?? []) {
    if (!plot.is_powered || !plot.resource_symbol) continue;

    // Every powered worksite feeds its workers, whatever it produces — grain
    // farms included.
    perHour.GRAIN += plot.grain_req_per_hour ?? 0;

    // Base PP is what the recipe cost below is priced off. Symbols outside
    // PRODUCING_RESOURCES (TAX plots) have no recipe, so they are not tracked.
    if (PRODUCING_RESOURCES.includes(plot.resource_symbol)) {
      basePP[plot.resource_symbol] += plot.total_base_pp_after_cap ?? 0;
    }
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

/**
 * What one region naturally produces per hour, split by resource.
 *
 * Read straight off the production-overview row: `<resource>_per_hr` is the
 * region's live production RATE for that resource, already reflecting which
 * worksites are actually powered and running. Only the natural resources are
 * returned — SPS/RESEARCH/AURA cannot be deposited into a natural-resource pool
 * and never offset a natural-resource burn.
 */
export function regionProductionPerHour(
  region: SplProductionOverviewRegion | null
): Record<string, number> {
  const perHour = zeroedNaturals();
  if (!region) return perHour;

  perHour.GRAIN = region.grain_per_hr ?? 0;
  perHour.WOOD = region.wood_per_hr ?? 0;
  perHour.STONE = region.stone_per_hr ?? 0;
  perHour.IRON = region.iron_per_hr ?? 0;
  return perHour;
}

/** One region's gross burn, its own production, and the gap between them. */
export interface RegionResourceBalance {
  /** symbol → units burned per hour (workers + recipes). */
  consumedPerHour: Record<string, number>;
  /** symbol → units the region produces itself per hour. */
  producedPerHour: Record<string, number>;
  /** symbol → max(0, consumed - produced): what must be supplied from outside. */
  externalNeedPerHour: Record<string, number>;
}

/**
 * Consumption, production and external need for ONE region.
 *
 * The subtraction happens per region on purpose. Resources are held per region
 * and moving them costs a transfer fee (and pool liquidity has a vesting lock),
 * so a surplus in one region must not silently cancel a deficit in another —
 * that would plan a top-up that no region can actually source.
 */
export function computeRegionResourceBalance(
  region: SplProductionOverviewRegion | null,
  overview: SplRegionOverviewData | null
): RegionResourceBalance {
  const consumedPerHour = regionConsumptionPerHour(overview);
  const producedPerHour = regionProductionPerHour(region);

  const symbols = new Set([
    ...NATURAL_RESOURCES,
    ...Object.keys(consumedPerHour),
  ]);
  const externalNeedPerHour: Record<string, number> = {};
  for (const symbol of symbols) {
    externalNeedPerHour[symbol] = Math.max(
      0,
      (consumedPerHour[symbol] ?? 0) - (producedPerHour[symbol] ?? 0)
    );
  }

  return { consumedPerHour, producedPerHour, externalNeedPerHour };
}

export interface WeeklyConsumption {
  /** symbol → resource units consumed per 7 days, summed across regions. */
  perResource: Record<string, number>;
  /** Notes worth surfacing in the plan (missing data, rate/accrual drift). */
  warnings: string[];
}

/**
 * Each resource's GROSS consumption over 7 days, summed across `regions` — how
 * much is actually burned, regardless of where it comes from.
 *
 * For sizing pool top-ups use {@link computeWeeklyPoolNeed} instead: what has to
 * be deposited is only the part the regions cannot produce themselves.
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

export interface WeeklyPoolNeed {
  /**
   * symbol → resource units that must come from outside the regions over
   * `productionHours`, summed across regions AFTER each region's own production
   * was netted off. This is what a pool top-up has to cover.
   */
  perResource: Record<string, number>;
  /** symbol → gross units burned per hour, summed across regions. */
  consumedPerHour: Record<string, number>;
  /** symbol → units produced per hour, summed across regions. */
  producedPerHour: Record<string, number>;
  /** symbol → per-region external need per hour, summed across regions. */
  externalNeedPerHour: Record<string, number>;
  /** Hours the `perResource` totals were projected over. */
  productionHours: number;
  /** Notes worth surfacing in the plan (missing data, rate/accrual drift). */
  warnings: string[];
}

/**
 * How much of each resource has to be supplied from OUTSIDE the regions over
 * `productionHours` — the figure pool top-ups are sized against.
 *
 * Netting is per region and clamped at 0 before anything is added up, so a
 * region growing more grain than it eats contributes 0, never a credit against
 * another region's deficit.
 *
 * `productionHours` is separate from the rate on purpose: the hourly external
 * need is the physical quantity, and how many hours a week actually produce is a
 * caller-supplied assumption (168 = every hour of the week).
 */
export function computeWeeklyPoolNeed(
  regions: SplProductionOverviewRegion[],
  balances: Record<string, RegionResourceBalance>,
  productionHours: number = HOURS_PER_WEEK,
  harvestableMap: Record<string, SplHarvestableResource[]> = {},
  now: Date = new Date()
): WeeklyPoolNeed {
  const consumedPerHour = zeroedNaturals();
  const producedPerHour = zeroedNaturals();
  const externalNeedPerHour = zeroedNaturals();
  const perResource = zeroedNaturals();
  const warnings: string[] = [];

  for (const region of regions) {
    const balance = balances[region.region_uid];
    if (!balance) {
      warnings.push(
        `${region.name}: no production data — its consumption is not counted`
      );
      continue;
    }

    for (const symbol of NATURAL_RESOURCES) {
      consumedPerHour[symbol] += balance.consumedPerHour[symbol] ?? 0;
      producedPerHour[symbol] += balance.producedPerHour[symbol] ?? 0;
      const need = balance.externalNeedPerHour[symbol] ?? 0;
      externalNeedPerHour[symbol] += need;
      perResource[symbol] += need * productionHours;
    }

    const drift = accrualDrift(
      region,
      balance.consumedPerHour,
      harvestableMap,
      now
    );
    if (drift) warnings.push(`${region.region_uid} (${region.name}): ${drift}`);
  }

  return {
    perResource,
    consumedPerHour,
    producedPerHour,
    externalNeedPerHour,
    productionHours,
    warnings,
  };
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

  const elapsedHours = (now.getTime() - lastClaimed.getTime()) / 3_600_000;

  if (elapsedHours < MIN_ACCRUAL_HOURS) return null;
  const maxExceeded =
    elapsedHours >= MAX_ACCRUAL_HOURS
      ? `\n Possibly inaccurate, as it has not been harvested for more than 7 days.`
      : "";

  for (const { symbol, amount } of costs) {
    const measured = amount / elapsedHours;
    const rate = rates[symbol] ?? 0;
    if (measured <= 0 || rate <= 0) continue;
    const ratio = measured / rate;
    if (ratio > 1.2 || ratio < 0.8) {
      return (
        `${symbol} rate ${rate.toFixed(1)}/hr disagrees with the ${measured.toFixed(1)}/hr ` +
        `accrued over the last ${elapsedHours.toFixed(0)}h — target may be off` +
        maxExceeded
      );
    }
  }
  return null;
}
