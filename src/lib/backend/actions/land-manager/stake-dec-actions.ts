"use server";

import { prisma } from "@/lib/prisma";
import { fetchRegionDataPlayer } from "@/lib/backend/api/spl/spl-land-api";
import { getAuthStatus } from "../auth-actions";

export interface StakeDecRegionPlanItem {
  region_uid: string;
  region_number: number;
  dec_stake_in_use: number;
  dec_stake_needed: number;
  shortfall: number;
}

export interface StakeDecPlan {
  items: StakeDecRegionPlanItem[];
  total_dec: number;
}

/**
 * For each enabled region with a DEC stake shortfall, return how much DEC must
 * be staked to fully cover it. Rows with no shortfall are filtered out.
 */
export async function getStakeDecPlan(
  enabledRegions: number[]
): Promise<StakeDecPlan> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) {
    return { items: [], total_dec: 0 };
  }
  if (enabledRegions.length === 0) {
    return { items: [], total_dec: 0 };
  }

  const regionData = await fetchRegionDataPlayer(auth.username);
  const stakingByDeed = new Map(
    regionData.staking_details.map((s) => [s.deed_uid, s])
  );
  const enabledSet = new Set(enabledRegions);

  // Sum needed / in-use per region (multiple deeds per region).
  const byRegion = new Map<
    number,
    { region_uid: string; in_use: number; needed: number }
  >();
  for (const deed of regionData.deeds) {
    if (!enabledSet.has(deed.region_number)) continue;
    const staking = stakingByDeed.get(deed.deed_uid);
    if (!staking) continue;
    const entry = byRegion.get(deed.region_number) ?? {
      region_uid: deed.region_uid,
      in_use: 0,
      needed: 0,
    };
    entry.in_use += staking.total_dec_stake_in_use ?? 0;
    entry.needed += staking.total_dec_stake_needed ?? 0;
    byRegion.set(deed.region_number, entry);
  }

  const items: StakeDecRegionPlanItem[] = [];
  let total_dec = 0;
  for (const [regionNumber, entry] of byRegion.entries()) {
    const shortfall = Math.max(0, entry.needed - entry.in_use);
    if (shortfall <= 0) continue;
    // Stake whole DEC units — engine accepts integers and the displayed
    // shortfall is rounded, so ceil any fractional remainder.
    const amount = Math.ceil(shortfall);
    items.push({
      region_uid: entry.region_uid,
      region_number: regionNumber,
      dec_stake_in_use: entry.in_use,
      dec_stake_needed: entry.needed,
      shortfall: amount,
    });
    total_dec += amount;
  }

  items.sort((a, b) => a.region_number - b.region_number);
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

export interface RecordStakeDecLogInput {
  player: string;
  /** region_uid → amount, broadcast & confirmed. */
  succeeded: Record<string, number>;
  /** region_uid → amount, attempted but failed/cancelled. */
  failed: Record<string, number>;
  error: string | null;
  txIds: string[];
}

/**
 * Persist a stake-DEC run. Always writes both succeeded and failed per region
 * so the admin can see what was actually staked vs. what was attempted but
 * didn't land. Upserts onto (date, player) — repeat runs accumulate.
 */
export async function recordStakeDecLog(
  input: RecordStakeDecLogInput
): Promise<void> {
  const { player, succeeded, failed, error, txIds } = input;
  const date = todayUtcDate();

  const totalSucceeded = Object.values(succeeded).reduce((s, v) => s + v, 0);
  const totalFailed = Object.values(failed).reduce((s, v) => s + v, 0);

  const existing = await prisma.landStakeDecLog.findUnique({
    where: { date_player: { date, player } },
  });

  if (existing) {
    await prisma.landStakeDecLog.update({
      where: { date_player: { date, player } },
      data: {
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
      },
    });
  } else {
    await prisma.landStakeDecLog.create({
      data: {
        date,
        player,
        succeeded_json: succeeded,
        failed_json: failed,
        total_succeeded: totalSucceeded,
        total_failed: totalFailed,
        error,
        transactions: txIds,
      },
    });
  }
}
