import type { SplProductionOverviewRegion } from "@/types/spl/landManager";

/**
 * DEC power up/down planning, pure so it runs in the browser on the player's
 * own (JWT) production overview read.
 */

/** "up" = stake (power up), "down" = unstake (power down). */
export type DecPowerDirection = "up" | "down";

export interface RegionDECInfo {
  region_number: number;
  region_uid: string;
  total_plot_count: number;
  dec_stake_needed: number;
  dec_stake_in_use: number;
}

export interface RegionStakedDEC {
  /** Per-region rows for the selected scope, sorted by region number. */
  regions: RegionDECInfo[];
  /**
   * Account-wide DEC currently staked (the global `dark_energy` pool). This is
   * the source of truth for whether enough DEC is staked overall — a region's
   * `dec_stake_in_use` can temporarily read 0 while a building is in progress,
   * even though that DEC is still staked in the global pool.
   */
  totalStaked: number;
  /** Sum of `dark_energy_required` across ALL of the player's regions. */
  totalRequired: number;
}

export const EMPTY_STAKED_DEC: RegionStakedDEC = {
  regions: [],
  totalStaked: 0,
  totalRequired: 0,
};

export interface DecPowerRegionPlanItem {
  region_uid: string;
  region_number: number;
  dec_stake_in_use: number;
  dec_stake_needed: number;
  /** DEC to power up (stake) or down (unstake) for this region. */
  amount: number;
}

export interface DecPowerPlan {
  items: DecPowerRegionPlanItem[];
  total_dec: number;
}

/**
 * Per-region DEC rows from the production overview, limited to
 * `regionNumbers` when given (null/undefined = all regions).
 */
export function regionStakedDecFrom(
  regions: SplProductionOverviewRegion[],
  regionNumbers?: number[] | null
): RegionStakedDEC {
  const regionSet = Array.isArray(regionNumbers)
    ? new Set(regionNumbers)
    : null;

  const selectedRegions = regions
    .filter((r) => !regionSet || regionSet.has(r.region_number))
    .map((r) => ({
      region_number: r.region_number,
      region_uid: r.region_uid,
      total_plot_count: r.plots_owned,
      dec_stake_needed: r.dark_energy_required,
      dec_stake_in_use: r.dark_energy_staked,
    }))
    .sort((a, b) => a.region_number - b.region_number);

  const totalDECRequired = selectedRegions.reduce(
    (sum, r) => sum + r.dec_stake_needed,
    0
  );
  const totalDECStaked = selectedRegions.reduce(
    (sum, r) => sum + r.dec_stake_in_use,
    0
  );

  return {
    regions: selectedRegions,
    totalStaked: totalDECStaked,
    totalRequired: totalDECRequired,
  };
}

function sumRegionalShortfall(regions: RegionDECInfo[]): number {
  return regions.reduce(
    (sum, r) => sum + Math.max(0, r.dec_stake_needed - r.dec_stake_in_use),
    0
  );
}

function sumRegionalOverStake(regions: RegionDECInfo[]): number {
  return regions.reduce(
    (sum, r) => sum + Math.max(0, r.dec_stake_in_use - r.dec_stake_needed),
    0
  );
}

/**
 * Build the plan of how much DEC to power up/down, and where.
 *
 * The amount that genuinely needs moving is usually the GLOBAL gap:
 *   - up   → `max(0, totalRequired - totalStaked)`
 *   - down → `max(0, totalStaked - totalRequired)`
 *
 * Rebalancing exception: when global totals are balanced but regions are
 * uneven (some short, others over-staked), both directions expose a
 * rebalancing target of `min(sumShortfall, sumOverStake)` so users can move
 * DEC between regions manually (unstake over regions, stake short regions).
 *
 * The selected target is distributed across regions that show a directional
 * gap. Staking rounds up (never under-stake); unstaking rounds down (never
 * over-unstake below requirements).
 */
export function buildDecPowerPlan(
  direction: DecPowerDirection,
  { regions, totalStaked, totalRequired }: RegionStakedDEC
): DecPowerPlan {
  const round = direction === "up" ? Math.ceil : Math.floor;
  const globalGap =
    direction === "up"
      ? totalRequired - totalStaked
      : totalStaked - totalRequired;

  const regionalShortfall = sumRegionalShortfall(regions);
  const regionalOverStake = sumRegionalOverStake(regions);
  const globallyBalanced = Math.abs(totalRequired - totalStaked) < 1e-6;
  const rebalanceTarget = globallyBalanced
    ? Math.min(regionalShortfall, regionalOverStake)
    : 0;

  const targetRaw = globalGap > 0 ? globalGap : rebalanceTarget;

  let remaining = Math.max(0, round(targetRaw));
  if (remaining <= 0) {
    return { items: [], total_dec: 0 };
  }

  const items: DecPowerRegionPlanItem[] = [];
  let total_dec = 0;
  for (const r of [...regions].sort(
    (a, b) => a.region_number - b.region_number
  )) {
    if (remaining <= 0) break;
    const regionGap =
      direction === "up"
        ? r.dec_stake_needed - r.dec_stake_in_use
        : r.dec_stake_in_use - r.dec_stake_needed;
    const gap = round(Math.max(0, regionGap));
    if (gap <= 0) continue;
    const amount = Math.min(gap, remaining);
    items.push({
      region_uid: r.region_uid,
      region_number: r.region_number,
      dec_stake_in_use: r.dec_stake_in_use,
      dec_stake_needed: r.dec_stake_needed,
      amount,
    });
    total_dec += amount;
    remaining -= amount;
  }

  return { items, total_dec };
}
