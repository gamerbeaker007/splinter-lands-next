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

// ── Donations log ─────────────────────────────────────────────────────────────

export interface RecordDonationsLogInput {
  player: string;
  paidDonations: Record<string, number>; // donations broadcast & confirmed
  unpaidDonations: Record<string, number>; // donations owed but not paid (cancelled / failed)
  donationError: string | null; // cancellation or error message when unpaidDonations is non-empty
  txIds: string[]; // tx ids from the donation broadcast(s)
}

/**
 * Persist the donation-payment portion of a run. Writes paid/unpaid/error and
 * appends donation tx ids. Upserts onto the same (date, player) row recorded by
 * recordHarvestLog so a single day for a player stays one row.
 */
export async function recordDonationsLog(
  input: RecordDonationsLogInput
): Promise<void> {
  const { player, paidDonations, unpaidDonations, donationError, txIds } =
    input;
  const date = today();

  const existing = await prisma.landHarvestLog.findUnique({
    where: { date_player: { date, player } },
  });

  if (existing) {
    await prisma.landHarvestLog.update({
      where: { date_player: { date, player } },
      data: {
        donations_json: mergeAmounts(
          existing.donations_json as Record<string, number>,
          paidDonations
        ),
        unpaid_donations_json: mergeAmounts(
          existing.unpaid_donations_json as Record<string, number>,
          unpaidDonations
        ),
        // Only overwrite the error when this run actually has one — keeps prior context if a later run was clean.
        ...(donationError ? { donation_error: donationError } : {}),
        donation_transactions: { push: txIds },
      },
    });
  } else {
    // No harvest row yet — unusual, but write a stub so the donation data isn't lost.
    await prisma.landHarvestLog.create({
      data: {
        date,
        player,
        resources_json: {},
        donations_json: paidDonations,
        unpaid_donations_json: unpaidDonations,
        donation_error: donationError,
        harvest_transactions: [],
        donation_transactions: txIds,
      },
    });
  }
}

// ── Donations-paid aggregation (admin) ────────────────────────────────────────

export interface DonationsPaidDayRow {
  date: string; // ISO yyyy-mm-dd
  totals: Record<string, number>; // summed across all players for the date
  contributors: string[]; // distinct players who paid that day, alphabetical
}

/**
 * Aggregate paid donations across all players by date. Returns most recent days
 * first, limited to `limit` rows.
 */
export async function getDonationsPaidByDay(
  limit = 30
): Promise<DonationsPaidDayRow[]> {
  const [harvestRows, mythicRows] = await Promise.all([
    prisma.landHarvestLog.findMany({
      orderBy: { date: "desc" },
      select: { date: true, player: true, donations_json: true },
      take: limit * 50,
    }),
    prisma.landMythicHarvestLog.findMany({
      orderBy: { date: "desc" },
      select: { date: true, player: true, donations_json: true },
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
    const donations = row.donations_json as Record<string, number>;
    let bucket = byDate.get(key);
    if (!bucket) {
      bucket = { totals: {}, contributors: new Set() };
      byDate.set(key, bucket);
    }
    let paidAnything = false;
    for (const [sym, amount] of Object.entries(donations ?? {})) {
      if (amount <= 0) continue;
      bucket.totals[sym] = Number.parseFloat(
        ((bucket.totals[sym] ?? 0) + amount).toFixed(3)
      );
      paidAnything = true;
    }
    if (paidAnything) bucket.contributors.add(row.player);
  }

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
  donations?: {
    paidDonations: Record<string, number>;
    unpaidDonations: Record<string, number>;
    donationError: string | null;
    donationTxIds: string[];
  }
): Promise<void> {
  const date = today();

  const existing = await prisma.landMythicHarvestLog.findUnique({
    where: { date_player: { date, player } },
  });

  const donationData = donations
    ? {
        donations_json:
          donations.paidDonations as unknown as Prisma.InputJsonValue,
        unpaid_donations_json:
          donations.unpaidDonations as unknown as Prisma.InputJsonValue,
        donation_error: donations.donationError,
        donation_transactions: donations.donationTxIds,
      }
    : {};

  if (existing) {
    await prisma.landMythicHarvestLog.update({
      where: { date_player: { date, player } },
      data: {
        runs: { increment: 1 },
        results_json: results as unknown as Prisma.InputJsonValue,
        transactions: { push: txIds },
        ...(donations && {
          ...donationData,
          donation_transactions: { push: donations.donationTxIds },
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
        ...donationData,
      },
    });
  }
}

// ── Today logs ────────────────────────────────────────────────────────────────

export async function getTodayLogs(): Promise<{
  harvest: {
    runs: number;
    resources_json: unknown;
    donations_json: unknown;
    unpaid_donations_json: unknown;
    donation_error: string | null;
    harvest_transactions: string[];
    donation_transactions: string[];
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
    donations_json: unknown;
    unpaid_donations_json: unknown;
    donation_error: string | null;
    transactions: string[];
    donation_transactions: string[];
  } | null;
  worker: {
    runs: number;
    rented_count: number;
    bought_count: number;
    staked_count: number;
    rent_total_dec: number;
    buy_total_dec: number;
    buy_total_usd: number;
    rent_transactions: string[];
    purchase_transactions: string[];
    stake_transactions: string[];
  } | null;
  stakeDec: {
    runs: number;
    succeeded_json: unknown;
    failed_json: unknown;
    total_succeeded: number;
    total_failed: number;
    error: string | null;
    transactions: string[];
  } | null;
  unstakeDec: {
    runs: number;
    succeeded_json: unknown;
    failed_json: unknown;
    total_succeeded: number;
    total_failed: number;
    error: string | null;
    transactions: string[];
  } | null;
}> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) {
    return {
      harvest: null,
      makeHarvestable: null,
      postHarvest: null,
      mythicHarvest: null,
      worker: null,
      stakeDec: null,
      unstakeDec: null,
    };
  }

  const date = today();
  const player = auth.username;

  const [
    harvest,
    makeHarvestable,
    postHarvest,
    mythicHarvest,
    worker,
    stakeDec,
    unstakeDec,
  ] = await Promise.all([
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
    prisma.landWorkerLog.findUnique({
      where: { date_player: { date, player } },
    }),
    prisma.landStakeDecLog.findUnique({
      where: { date_player: { date, player } },
    }),
    prisma.landUnstakeDecLog.findUnique({
      where: { date_player: { date, player } },
    }),
  ]);

  return {
    harvest: harvest
      ? {
          runs: harvest.runs,
          resources_json: harvest.resources_json,
          donations_json: harvest.donations_json,
          unpaid_donations_json: harvest.unpaid_donations_json,
          donation_error: harvest.donation_error,
          harvest_transactions: harvest.harvest_transactions,
          donation_transactions: harvest.donation_transactions,
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
          donations_json: mythicHarvest.donations_json,
          unpaid_donations_json: mythicHarvest.unpaid_donations_json,
          donation_error: mythicHarvest.donation_error,
          transactions: mythicHarvest.transactions,
          donation_transactions: mythicHarvest.donation_transactions,
        }
      : null,
    worker: worker
      ? {
          runs: worker.runs,
          rented_count: worker.rented_count,
          bought_count: worker.bought_count,
          staked_count: worker.staked_count,
          rent_total_dec: worker.rent_total_dec,
          buy_total_dec: worker.buy_total_dec,
          buy_total_usd: worker.buy_total_usd,
          rent_transactions: worker.rent_transactions,
          purchase_transactions: worker.purchase_transactions,
          stake_transactions: worker.stake_transactions,
        }
      : null,
    stakeDec: stakeDec
      ? {
          runs: stakeDec.runs,
          succeeded_json: stakeDec.succeeded_json,
          failed_json: stakeDec.failed_json,
          total_succeeded: stakeDec.total_succeeded,
          total_failed: stakeDec.total_failed,
          error: stakeDec.error,
          transactions: stakeDec.transactions,
        }
      : null,
    unstakeDec: unstakeDec
      ? {
          runs: unstakeDec.runs,
          succeeded_json: unstakeDec.succeeded_json,
          failed_json: unstakeDec.failed_json,
          total_succeeded: unstakeDec.total_succeeded,
          total_failed: unstakeDec.total_failed,
          error: unstakeDec.error,
          transactions: unstakeDec.transactions,
        }
      : null,
  };
}

// ── Worker log (rental + purchase) ─────────────────────────────────────────────

export interface RecordRentalLogInput {
  player: string;
  rentedCount: number;
  stakedCount: number;
  totalDec: number;
  rentTxIds: string[];
  stakeTxIds: string[];
}

/** Persist a rent-and-stake run. Upserts onto the (date, player) worker row — repeated runs accumulate. */
export async function recordRentalLog(
  input: RecordRentalLogInput
): Promise<void> {
  const { player, rentedCount, stakedCount, totalDec, rentTxIds, stakeTxIds } =
    input;
  const date = today();

  const existing = await prisma.landWorkerLog.findUnique({
    where: { date_player: { date, player } },
  });

  if (existing) {
    await prisma.landWorkerLog.update({
      where: { date_player: { date, player } },
      data: {
        runs: { increment: 1 },
        rented_count: { increment: rentedCount },
        staked_count: { increment: stakedCount },
        rent_total_dec: { increment: totalDec },
        rent_transactions: { push: rentTxIds },
        stake_transactions: { push: stakeTxIds },
      },
    });
  } else {
    await prisma.landWorkerLog.create({
      data: {
        date,
        player,
        rented_count: rentedCount,
        staked_count: stakedCount,
        rent_total_dec: totalDec,
        rent_transactions: rentTxIds,
        stake_transactions: stakeTxIds,
      },
    });
  }
}

export interface RecordPurchaseLogInput {
  player: string;
  boughtCount: number;
  stakedCount: number;
  totalDec: number;
  totalUsd: number;
  purchaseTxIds: string[];
  stakeTxIds: string[];
}

/** Persist a buy-and-stake run. Upserts onto the same (date, player) worker row as rentals. */
export async function recordPurchaseLog(
  input: RecordPurchaseLogInput
): Promise<void> {
  const {
    player,
    boughtCount,
    stakedCount,
    totalDec,
    totalUsd,
    purchaseTxIds,
    stakeTxIds,
  } = input;
  const date = today();

  const existing = await prisma.landWorkerLog.findUnique({
    where: { date_player: { date, player } },
  });

  if (existing) {
    await prisma.landWorkerLog.update({
      where: { date_player: { date, player } },
      data: {
        runs: { increment: 1 },
        bought_count: { increment: boughtCount },
        staked_count: { increment: stakedCount },
        buy_total_dec: { increment: totalDec },
        buy_total_usd: { increment: totalUsd },
        purchase_transactions: { push: purchaseTxIds },
        stake_transactions: { push: stakeTxIds },
      },
    });
  } else {
    await prisma.landWorkerLog.create({
      data: {
        date,
        player,
        bought_count: boughtCount,
        staked_count: stakedCount,
        buy_total_dec: totalDec,
        buy_total_usd: totalUsd,
        purchase_transactions: purchaseTxIds,
        stake_transactions: stakeTxIds,
      },
    });
  }
}
