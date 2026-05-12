"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import {
  ActionSummary,
  MythicHarvestResult,
  PostHarvestActionSummary,
  SERVICE_FEE_PCT,
} from "@/types/landManager";
import {
  SplHarvestableResource,
  SplProductionOverviewRegion,
} from "@/types/spl/landManager";
import { shouldApplyFee } from "@/lib/shared/landManagerUtils";
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

function summarizeResources(
  harvestable: Record<string, SplHarvestableResource[]>
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const items of Object.values(harvestable)) {
    for (const item of items) {
      totals[item.token_symbol] =
        (totals[item.token_symbol] ?? 0) + item.amount_claimable;
    }
  }
  return totals;
}

function summarizeFees(
  player: string,
  regions: SplProductionOverviewRegion[],
  harvestable: Record<string, SplHarvestableResource[]>
): Record<string, number> {
  const fees: Record<string, number> = {};
  for (const region of regions) {
    if (!shouldApplyFee(player, region.region_number)) continue;
    for (const item of harvestable[region.region_uid] ?? []) {
      const fee = Number.parseFloat(
        ((item.amount_claimable * SERVICE_FEE_PCT) / 100).toFixed(3)
      );
      if (fee > 0)
        fees[item.token_symbol] = (fees[item.token_symbol] ?? 0) + fee;
    }
  }
  return fees;
}

export async function recordHarvestLog(
  player: string,
  regions: SplProductionOverviewRegion[],
  harvestable: Record<string, SplHarvestableResource[]>,
  txIds: string[]
): Promise<void> {
  const date = today();
  const resources = summarizeResources(harvestable);
  const fees = summarizeFees(player, regions, harvestable);

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
        fees_json: mergeAmounts(
          existing.fees_json as Record<string, number>,
          fees
        ),
        transactions: { push: txIds },
      },
    });
  } else {
    await prisma.landHarvestLog.create({
      data: {
        date,
        player,
        resources_json: resources,
        fees_json: fees,
        transactions: txIds,
      },
    });
  }
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
  txIds: string[]
): Promise<void> {
  const date = today();

  const existing = await prisma.landMythicHarvestLog.findUnique({
    where: { date_player: { date, player } },
  });

  if (existing) {
    await prisma.landMythicHarvestLog.update({
      where: { date_player: { date, player } },
      data: {
        runs: { increment: 1 },
        results_json: results as unknown as Prisma.InputJsonValue,
        transactions: { push: txIds },
      },
    });
  } else {
    await prisma.landMythicHarvestLog.create({
      data: {
        date,
        player,
        results_json: results as unknown as Prisma.InputJsonValue,
        transactions: txIds,
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
    transactions: string[];
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
    };
  }

  const date = today();
  const player = auth.username;

  const [harvest, makeHarvestable, postHarvest, mythicHarvest] =
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
    ]);

  return {
    harvest: harvest
      ? {
          runs: harvest.runs,
          resources_json: harvest.resources_json,
          fees_json: harvest.fees_json,
          transactions: harvest.transactions,
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
          transactions: mythicHarvest.transactions,
        }
      : null,
  };
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
