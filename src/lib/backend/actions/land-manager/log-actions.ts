"use server";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ActionSummary,
  MythicHarvestResult,
  PostHarvestActionSummary,
} from "@/types/landManager";
import { getAuthStatus } from "../auth-actions";

function today(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function mergeAmounts(
  existing: Record<string, number>,
  incoming: Record<string, number>
): Record<string, number> {
  const merged = { ...existing };
  for (const [sym, amount] of Object.entries(incoming)) {
    merged[sym] = (merged[sym] ?? 0) + amount;
  }
  return merged;
}

// ── Harvest log ───────────────────────────────────────────────────────────────

export interface RecordHarvestLogInput {
  player: string;
  resources: Record<string, number>; // totals harvested this run (per resource)
  txIds: string[]; // tx ids from the harvest broadcast
}

/** Persist the harvest portion of a run. Idempotent per (date, player) — repeated runs increment `runs` and merge resources. */
export async function recordHarvestLog(
  input: RecordHarvestLogInput
): Promise<void> {
  const { player, resources, txIds } = input;
  const date = today();

  const existing = await prisma.landHarvestLog.findUnique({
    where: { date_player: { date, player } },
  });

  if (existing) {
    await prisma.landHarvestLog.update({
      where: { date_player: { date, player } },
      data: {
        runs: { increment: 1 },
        resources_json: mergeAmounts(
          existing.resources_json as Record<string, number>,
          resources
        ),
        harvest_transactions: { push: txIds },
      },
    });
  } else {
    await prisma.landHarvestLog.create({
      data: {
        date,
        player,
        resources_json: resources,
        harvest_transactions: txIds,
      },
    });
  }
}

// ── Fees log ──────────────────────────────────────────────────────────────────

export interface RecordFeesLogInput {
  player: string;
  paidFees: Record<string, number>; // fees broadcast & confirmed
  unpaidFees: Record<string, number>; // fees owed but not paid (cancelled / failed)
  feeError: string | null; // cancellation or error message when unpaidFees is non-empty
  txIds: string[]; // tx ids from the fee broadcast(s)
}

/**
 * Persist the fee-payment portion of a run. Writes paid/unpaid/error and
 * appends fee tx ids. Upserts onto the same (date, player) row recorded by
 * recordHarvestLog so a single day for a player stays one row.
 */
export async function recordFeesLog(input: RecordFeesLogInput): Promise<void> {
  const { player, paidFees, unpaidFees, feeError, txIds } = input;
  const date = today();

  const existing = await prisma.landHarvestLog.findUnique({
    where: { date_player: { date, player } },
  });

  if (existing) {
    await prisma.landHarvestLog.update({
      where: { date_player: { date, player } },
      data: {
        fees_json: mergeAmounts(
          existing.fees_json as Record<string, number>,
          paidFees
        ),
        unpaid_fees_json: mergeAmounts(
          existing.unpaid_fees_json as Record<string, number>,
          unpaidFees
        ),
        // Only overwrite the error when this run actually has one — keeps prior context if a later run was clean.
        ...(feeError ? { fee_error: feeError } : {}),
        fee_transactions: { push: txIds },
      },
    });
  } else {
    // No harvest row yet — unusual, but write a stub so the fee data isn't lost.
    await prisma.landHarvestLog.create({
      data: {
        date,
        player,
        resources_json: {},
        fees_json: paidFees,
        unpaid_fees_json: unpaidFees,
        fee_error: feeError,
        harvest_transactions: [],
        fee_transactions: txIds,
      },
    });
  }
}

// ── Fees-paid aggregation (admin) ─────────────────────────────────────────────

export interface FeesPaidDayRow {
  date: string; // ISO yyyy-mm-dd
  totals: Record<string, number>; // summed across all players for the date
  contributors: string[]; // distinct players who paid that day, alphabetical
}

/**
 * Aggregate paid fees across all players by date. Returns most recent days
 * first, limited to `limit` rows.
 */
export async function getFeesPaidByDay(limit = 30): Promise<FeesPaidDayRow[]> {
  const [harvestRows, mythicRows] = await Promise.all([
    prisma.landHarvestLog.findMany({
      orderBy: { date: "desc" },
      select: { date: true, player: true, fees_json: true },
      take: limit * 50,
    }),
    prisma.landMythicHarvestLog.findMany({
      orderBy: { date: "desc" },
      select: { date: true, player: true, fees_json: true },
      take: limit * 50,
    }),
  ]);

  const allRows = [...harvestRows, ...mythicRows];

  const byDate = new Map<
    string,
    { totals: Record<string, number>; contributors: Set<string> }
  >();

  for (const row of allRows) {
    const key = row.date.toISOString().slice(0, 10);
    const fees = row.fees_json as Record<string, number>;
    let bucket = byDate.get(key);
    if (!bucket) {
      bucket = { totals: {}, contributors: new Set() };
      byDate.set(key, bucket);
    }
    let paidAnything = false;
    for (const [sym, amount] of Object.entries(fees ?? {})) {
      if (amount <= 0) continue;
      bucket.totals[sym] = Number.parseFloat(
        ((bucket.totals[sym] ?? 0) + amount).toFixed(3)
      );
      paidAnything = true;
    }
    if (paidAnything) bucket.contributors.add(row.player);
  }

  console.log(
    "Aggregated fees by day:",
    [...byDate.entries()].map(([date, v]) => ({
      date,
      totals: v.totals,
      contributors: [...v.contributors],
    }))
  );
  return [...byDate.entries()]
    .filter(([, v]) => Object.keys(v.totals).length > 0)
    .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
    .slice(0, limit)
    .map(([date, v]) => ({
      date,
      totals: v.totals,
      contributors: [...v.contributors].sort(),
    }));
}

// ── Make-harvestable log ──────────────────────────────────────────────────────

function actionKey(a: ActionSummary): string {
  return `${a.type}|${a.from_region}|${a.to_region}|${a.from_symbol}|${a.to_symbol}`;
}

function mergeActions(
  existing: ActionSummary[],
  incoming: ActionSummary[]
): ActionSummary[] {
  const map: Record<string, ActionSummary> = {};
  for (const a of existing) map[actionKey(a)] = { ...a };
  for (const a of incoming) {
    const k = actionKey(a);
    if (map[k]) {
      map[k].in_amount += a.in_amount;
      map[k].out_amount += a.out_amount;
    } else map[k] = { ...a };
  }
  return Object.values(map);
}

export async function recordMakeHarvestableLog(
  player: string,
  actions: ActionSummary[],
  txIds: string[]
): Promise<void> {
  const date = today();

  const existing = await prisma.landMakeHarvestableLog.findUnique({
    where: { date_player: { date, player } },
  });

  if (existing) {
    const existingActions = existing.actions_json as unknown as ActionSummary[];
    const merged = mergeActions(
      existingActions,
      actions
    ) as unknown as Prisma.InputJsonValue;
    await prisma.landMakeHarvestableLog.update({
      where: { date_player: { date, player } },
      data: {
        runs: { increment: 1 },
        actions_json: merged,
        transactions: { push: txIds },
      },
    });
  } else {
    await prisma.landMakeHarvestableLog.create({
      data: {
        date,
        player,
        actions_json: actions as unknown as Prisma.InputJsonValue,
        transactions: txIds,
      },
    });
  }
}

// ── Post-harvest log ──────────────────────────────────────────────────────────

function mergePostHarvestActions(
  existing: PostHarvestActionSummary[],
  incoming: PostHarvestActionSummary[]
): PostHarvestActionSummary[] {
  const map: Record<string, PostHarvestActionSummary> = {};
  for (const a of existing)
    map[`${a.type}|${a.region_uid}|${a.symbol}`] = { ...a };
  for (const a of incoming) {
    const k = `${a.type}|${a.region_uid}|${a.symbol}`;
    if (map[k]) {
      map[k].resource_in += a.resource_in;
      map[k].dec_amount += a.dec_amount;
    } else map[k] = { ...a };
  }
  return Object.values(map);
}

export async function recordPostHarvestLog(
  player: string,
  actions: PostHarvestActionSummary[],
  txIds: string[]
): Promise<void> {
  if (actions.length === 0) return;
  const date = today();
  const existing = await prisma.landPostHarvestLog.findUnique({
    where: { date_player: { date, player } },
  });
  if (existing) {
    const merged = mergePostHarvestActions(
      existing.actions_json as unknown as PostHarvestActionSummary[],
      actions
    ) as unknown as Prisma.InputJsonValue;
    await prisma.landPostHarvestLog.update({
      where: { date_player: { date, player } },
      data: {
        runs: { increment: 1 },
        actions_json: merged,
        transactions: { push: txIds },
      },
    });
  } else {
    await prisma.landPostHarvestLog.create({
      data: {
        date,
        player,
        actions_json: actions as unknown as Prisma.InputJsonValue,
        transactions: txIds,
      },
    });
  }
}

// ── Mythic harvest log ────────────────────────────────────────────────────────

export async function recordMythicHarvestLog(
  player: string,
  results: MythicHarvestResult[],
  txIds: string[],
  fees?: {
    paidFees: Record<string, number>;
    unpaidFees: Record<string, number>;
    feeError: string | null;
    feeTxIds: string[];
  }
): Promise<void> {
  const date = today();

  const existing = await prisma.landMythicHarvestLog.findUnique({
    where: { date_player: { date, player } },
  });

  const feeData = fees
    ? {
        fees_json: fees.paidFees as unknown as Prisma.InputJsonValue,
        unpaid_fees_json: fees.unpaidFees as unknown as Prisma.InputJsonValue,
        fee_error: fees.feeError,
        fee_transactions: fees.feeTxIds,
      }
    : {};

  if (existing) {
    await prisma.landMythicHarvestLog.update({
      where: { date_player: { date, player } },
      data: {
        runs: { increment: 1 },
        results_json: results as unknown as Prisma.InputJsonValue,
        transactions: { push: txIds },
        ...(fees && {
          ...feeData,
          fee_transactions: { push: fees.feeTxIds },
        }),
      },
    });
  } else {
    await prisma.landMythicHarvestLog.create({
      data: {
        date,
        player,
        results_json: results as unknown as Prisma.InputJsonValue,
        transactions: txIds,
        ...feeData,
      },
    });
  }
}

// ── Today logs ────────────────────────────────────────────────────────────────

export async function getTodayLogs(): Promise<{
  harvest: {
    runs: number;
    resources_json: unknown;
    fees_json: unknown;
    unpaid_fees_json: unknown;
    fee_error: string | null;
    harvest_transactions: string[];
    fee_transactions: string[];
  } | null;
  makeHarvestable: {
    runs: number;
    actions_json: unknown;
    transactions: string[];
  } | null;
  postHarvest: {
    runs: number;
    actions_json: unknown;
    transactions: string[];
  } | null;
  mythicHarvest: {
    runs: number;
    results_json: unknown;
    fees_json: unknown;
    unpaid_fees_json: unknown;
    fee_error: string | null;
    transactions: string[];
    fee_transactions: string[];
  } | null;
  rental: {
    runs: number;
    rented_count: number;
    staked_count: number;
    total_dec: number;
    rent_transactions: string[];
    stake_transactions: string[];
  } | null;
}> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) {
    return {
      harvest: null,
      makeHarvestable: null,
      postHarvest: null,
      mythicHarvest: null,
      rental: null,
    };
  }

  const date = today();
  const player = auth.username;

  const [harvest, makeHarvestable, postHarvest, mythicHarvest, rental] =
    await Promise.all([
      prisma.landHarvestLog.findUnique({
        where: { date_player: { date, player } },
      }),
      prisma.landMakeHarvestableLog.findUnique({
        where: { date_player: { date, player } },
      }),
      prisma.landPostHarvestLog.findUnique({
        where: { date_player: { date, player } },
      }),
      prisma.landMythicHarvestLog.findUnique({
        where: { date_player: { date, player } },
      }),
      prisma.landRentalLog.findUnique({
        where: { date_player: { date, player } },
      }),
    ]);

  return {
    harvest: harvest
      ? {
          runs: harvest.runs,
          resources_json: harvest.resources_json,
          fees_json: harvest.fees_json,
          unpaid_fees_json: harvest.unpaid_fees_json,
          fee_error: harvest.fee_error,
          harvest_transactions: harvest.harvest_transactions,
          fee_transactions: harvest.fee_transactions,
        }
      : null,
    makeHarvestable: makeHarvestable
      ? {
          runs: makeHarvestable.runs,
          actions_json: makeHarvestable.actions_json,
          transactions: makeHarvestable.transactions,
        }
      : null,
    postHarvest: postHarvest
      ? {
          runs: postHarvest.runs,
          actions_json: postHarvest.actions_json,
          transactions: postHarvest.transactions,
        }
      : null,
    mythicHarvest: mythicHarvest
      ? {
          runs: mythicHarvest.runs,
          results_json: mythicHarvest.results_json,
          fees_json: mythicHarvest.fees_json,
          unpaid_fees_json: mythicHarvest.unpaid_fees_json,
          fee_error: mythicHarvest.fee_error,
          transactions: mythicHarvest.transactions,
          fee_transactions: mythicHarvest.fee_transactions,
        }
      : null,
    rental: rental
      ? {
          runs: rental.runs,
          rented_count: rental.rented_count,
          staked_count: rental.staked_count,
          total_dec: rental.total_dec,
          rent_transactions: rental.rent_transactions,
          stake_transactions: rental.stake_transactions,
        }
      : null,
  };
}

// ── Rental log ───────────────────────────────────────────────────────────────

export interface RecordRentalLogInput {
  player: string;
  rentedCount: number;
  stakedCount: number;
  totalDec: number;
  rentTxIds: string[];
  stakeTxIds: string[];
}

/** Persist a rent-and-stake run. Upserts onto the (date, player) row — repeated runs accumulate. */
export async function recordRentalLog(
  input: RecordRentalLogInput
): Promise<void> {
  const { player, rentedCount, stakedCount, totalDec, rentTxIds, stakeTxIds } =
    input;
  const date = today();

  const existing = await prisma.landRentalLog.findUnique({
    where: { date_player: { date, player } },
  });

  if (existing) {
    await prisma.landRentalLog.update({
      where: { date_player: { date, player } },
      data: {
        runs: { increment: 1 },
        rented_count: { increment: rentedCount },
        staked_count: { increment: stakedCount },
        total_dec: { increment: totalDec },
        rent_transactions: { push: rentTxIds },
        stake_transactions: { push: stakeTxIds },
      },
    });
  } else {
    await prisma.landRentalLog.create({
      data: {
        date,
        player,
        rented_count: rentedCount,
        staked_count: stakedCount,
        total_dec: totalDec,
        rent_transactions: rentTxIds,
        stake_transactions: stakeTxIds,
      },
    });
  }
}

// ── Acknowledge harvest ───────────────────────────────────────────────────────

export async function acknowledgeHarvest(): Promise<void> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) return;

  await prisma.landManagerConfig.upsert({
    where: { player: auth.username },
    update: { fee_accepted: true },
    create: { player: auth.username, enabled_regions: [], fee_accepted: true },
  });
}
