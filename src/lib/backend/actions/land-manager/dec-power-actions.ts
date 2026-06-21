"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { fetchProductionOverview } from "../../api/spl/spl-land-api";
import { getAuthStatus } from "../auth-actions";

/** "up" = stake (power up), "down" = unstake (power down). */
export type DecPowerDirection = "up" | "down";

const EMPTY_STAKED_DEC: RegionStakedDEC = {
  regions: [],
  totalStaked: 0,
  totalRequired: 0,
};

export interface RegionDECInfo {
  region_number: number;
  region_uid: string;
  total_plot_count: number;
  dec_stake_needed: number;
  dec_stake_in_use: number;
}

export interface RegionStakedDEC {
  /** Per-region rows for the enabled regions, sorted by region number. */
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

export async function getRegionStakedDEC(
  enabledRegions: number[]
): Promise<RegionStakedDEC> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) return EMPTY_STAKED_DEC;
  if (enabledRegions.length === 0) return EMPTY_STAKED_DEC;

  const cookieStore = await cookies();
  const jwt = cookieStore.get("jwt_token")?.value ?? null;
  if (!jwt) return EMPTY_STAKED_DEC;

  const { regions } = await fetchProductionOverview(auth.username, jwt);
  const enabledSet = new Set(enabledRegions);

  const enabled = regions
    .filter((r) => enabledSet.has(r.region_number))
    .map((r) => ({
      region_number: r.region_number,
      region_uid: r.region_uid,
      total_plot_count: r.plots_owned,
      dec_stake_needed: r.dark_energy_required,
      dec_stake_in_use: r.dark_energy_staked,
    }))
    .sort((a, b) => a.region_number - b.region_number);

  const totalDECRequired = enabled.reduce(
    (sum, r) => sum + r.dec_stake_needed,
    0
  );
  const totalDECStaked = enabled.reduce(
    (sum, r) => sum + r.dec_stake_in_use,
    0
  );

  return {
    regions: enabled,
    totalStaked: totalDECStaked,
    totalRequired: totalDECRequired,
  };
}

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
 * Build the plan of how much DEC to power up/down, and where.
 *
 * The amount that genuinely needs moving is the GLOBAL gap, not the sum of
 * per-region gaps:
 *   - up   → `max(0, totalRequired - totalStaked)` (shortfall to stake)
 *   - down → `max(0, totalStaked - totalRequired)` (excess to unstake)
 *
 * A region's `dec_stake_in_use` can read 0 while a building is in progress even
 * though that DEC is still staked in the global pool, which would otherwise
 * produce a false shortfall (up) or hide a real excess. When the global pool
 * already satisfies the direction, the plan is empty.
 *
 * The global gap is then distributed across the enabled regions that still show
 * an apparent per-region gap in that direction, so the user knows where to act.
 * Staking rounds up (never under-stake); unstaking rounds down (never
 * over-unstake below requirements).
 */
export async function getDecPowerPlan(
  enabledRegions: number[],
  direction: DecPowerDirection
): Promise<DecPowerPlan> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) {
    return { items: [], total_dec: 0 };
  }
  if (enabledRegions.length === 0) {
    return { items: [], total_dec: 0 };
  }

  const { regions, totalStaked, totalRequired } =
    await getRegionStakedDEC(enabledRegions);

  const round = direction === "up" ? Math.ceil : Math.floor;
  const globalGap =
    direction === "up"
      ? totalRequired - totalStaked
      : totalStaked - totalRequired;

  let remaining = Math.max(0, round(globalGap));
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

// ── Logging ──────────────────────────────────────────────────────────────────

function todayUtcDate(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function mergeAmounts(
  existing: Record<string, number>,
  incoming: Record<string, number>
): Record<string, number> {
  const merged = { ...existing };
  for (const [k, v] of Object.entries(incoming)) {
    merged[k] = (merged[k] ?? 0) + v;
  }
  return merged;
}

export interface RecordDecPowerLogInput {
  player: string;
  /** region_uid → amount, broadcast & confirmed. */
  succeeded: Record<string, number>;
  /** region_uid → amount, attempted but failed/cancelled. */
  failed: Record<string, number>;
  error: string | null;
  txIds: string[];
}

/**
 * Persist a power up/down run. Stake and unstake are opposite operations, so
 * each writes to its own table (`land_stake_dec_log` / `land_unstake_dec_log`).
 * Always writes both succeeded and failed per region so the admin can see what
 * actually landed vs. what was attempted. Upserts onto (date, player).
 */
export async function recordDecPowerLog(
  direction: DecPowerDirection,
  input: RecordDecPowerLogInput
): Promise<void> {
  const { player, succeeded, failed, error, txIds } = input;
  const date = todayUtcDate();

  const totalSucceeded = Object.values(succeeded).reduce((s, v) => s + v, 0);
  const totalFailed = Object.values(failed).reduce((s, v) => s + v, 0);

  const createData = {
    date,
    player,
    succeeded_json: succeeded,
    failed_json: failed,
    total_succeeded: totalSucceeded,
    total_failed: totalFailed,
    error,
    transactions: txIds,
  };

  const updateData = (existing: {
    succeeded_json: unknown;
    failed_json: unknown;
  }) => ({
    runs: { increment: 1 },
    succeeded_json: mergeAmounts(
      existing.succeeded_json as Record<string, number>,
      succeeded
    ),
    failed_json: mergeAmounts(
      existing.failed_json as Record<string, number>,
      failed
    ),
    total_succeeded: { increment: totalSucceeded },
    total_failed: { increment: totalFailed },
    ...(error ? { error } : {}),
    transactions: { push: txIds },
  });

  const where = { date_player: { date, player } };

  if (direction === "up") {
    const existing = await prisma.landStakeDecLog.findUnique({ where });
    if (existing) {
      await prisma.landStakeDecLog.update({
        where,
        data: updateData(existing),
      });
    } else {
      await prisma.landStakeDecLog.create({ data: createData });
    }
  } else {
    const existing = await prisma.landUnstakeDecLog.findUnique({ where });
    if (existing) {
      await prisma.landUnstakeDecLog.update({
        where,
        data: updateData(existing),
      });
    } else {
      await prisma.landUnstakeDecLog.create({ data: createData });
    }
  }
}
