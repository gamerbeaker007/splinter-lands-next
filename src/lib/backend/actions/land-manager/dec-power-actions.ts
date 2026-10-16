"use server";

import type { DecPowerDirection } from "@/lib/shared/decPower";
import { requirePlayer } from "@/lib/backend/auth/requirePlayer";
import { prisma } from "@/lib/prisma";

// The plan (production overview → regions → DEC to move) is built in the
// browser on the player's own JWT read: see lib/shared/decPower.ts.

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
  const { succeeded, failed, error, txIds } = input;
  const player = await requirePlayer(input.player);
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
