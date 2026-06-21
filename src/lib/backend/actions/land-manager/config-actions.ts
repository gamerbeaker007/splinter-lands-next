"use server";
import { prisma } from "@/lib/prisma";
import {
  BUY_BATCH_SIZE_MAX,
  BUY_BATCH_SIZE_MIN,
  BuyConfig,
  BuyStrategy,
  DEFAULT_BUY_STRATEGY,
  DEFAULT_DONATION_CONFIG,
  DEFAULT_MAKE_HARVESTABLE_STRATEGIES,
  DEFAULT_POST_HARVEST_EXCLUDED_RESOURCES,
  DEFAULT_POST_HARVEST_POOL_PCT,
  DEFAULT_POST_HARVEST_SELL_PCT,
  DEFAULT_POST_HARVEST_STRATEGY,
  DEFAULT_RENTAL_STRATEGY,
  DonationConfig,
  LandManagerConfig,
  MakeHarvestableStrategy,
  PostHarvestStrategy,
  RentalConfig,
  RentalStrategy,
} from "@/types/landManager";
import { getAuthStatus } from "../auth-actions";

export async function getLandManagerConfig(): Promise<LandManagerConfig | null> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) return null;

  const row = await prisma.landManagerConfig.findUnique({
    where: { player: auth.username },
  });

  return {
    player: auth.username,
    enabled_regions: (row?.enabled_regions as number[]) ?? [],
    make_harvestable_strategies:
      (row?.make_harvestable_strategies as MakeHarvestableStrategy[]) ??
      DEFAULT_MAKE_HARVESTABLE_STRATEGIES,
    donation: {
      enabled: row?.donation_enabled ?? DEFAULT_DONATION_CONFIG.enabled,
      pct: row?.donation_pct ?? DEFAULT_DONATION_CONFIG.pct,
      daily_caps:
        (row?.donation_daily_caps_json as Record<string, number>) ??
        DEFAULT_DONATION_CONFIG.daily_caps,
    },
    post_harvest_strategy:
      (row?.post_harvest_strategy as PostHarvestStrategy) ??
      DEFAULT_POST_HARVEST_STRATEGY,
    post_harvest_excluded_resources:
      (row?.post_harvest_excluded_resources as string[]) ??
      DEFAULT_POST_HARVEST_EXCLUDED_RESOURCES,
    post_harvest_sell_pct:
      row?.post_harvest_sell_pct ?? DEFAULT_POST_HARVEST_SELL_PCT,
    post_harvest_pool_pct:
      row?.post_harvest_pool_pct ?? DEFAULT_POST_HARVEST_POOL_PCT,
    rental: {
      strategy:
        (row?.rental_strategy as RentalStrategy) ?? DEFAULT_RENTAL_STRATEGY,
      max_total_dec: row?.rental_max_total_dec ?? 0,
      max_dec_per_day_per_worker: row?.rental_max_dec_per_day_per_worker ?? 0,
      min_land_base_pp: row?.rental_min_land_base_pp ?? 0,
      min_foil: row?.rental_min_foil ?? 0,
      rental_batch_size: row?.rental_batch_size ?? null,
      land_renters_only: row?.rental_land_renters_only ?? false,
    },
    buy: {
      strategy: (row?.buy_strategy as BuyStrategy) ?? DEFAULT_BUY_STRATEGY,
      max_total_dec: row?.buy_max_total_dec ?? 0,
      max_dec_per_worker: row?.buy_max_dec_per_worker ?? 0,
      min_land_base_pp: row?.buy_min_land_base_pp ?? 0,
      min_foil: row?.buy_min_foil ?? 0,
      buy_batch_size: row?.buy_batch_size ?? 10,
    },
  };
}

export async function saveBuyConfig(
  buy: BuyConfig
): Promise<{ success: boolean; error?: string }> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) {
    return { success: false, error: "Not authenticated" };
  }

  const batchSize = Math.max(
    BUY_BATCH_SIZE_MIN,
    Math.min(BUY_BATCH_SIZE_MAX, Math.floor(buy.buy_batch_size || 0) || 1)
  );

  const data = {
    buy_strategy: buy.strategy,
    buy_max_total_dec: buy.max_total_dec,
    buy_max_dec_per_worker: buy.max_dec_per_worker,
    buy_min_land_base_pp: buy.min_land_base_pp,
    buy_min_foil: buy.min_foil,
    buy_batch_size: batchSize,
  };

  try {
    await prisma.landManagerConfig.upsert({
      where: { player: auth.username },
      update: data,
      create: { player: auth.username, enabled_regions: [], ...data },
    });
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: msg };
  }
}

export async function saveDonationConfig(
  donation: DonationConfig
): Promise<{ success: boolean; error?: string }> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) {
    return { success: false, error: "Not authenticated" };
  }

  const pct = Math.max(0, Math.min(100, Math.floor(donation.pct)));
  const cleanedCaps: Record<string, number> = {};
  for (const [symbol, value] of Object.entries(donation.daily_caps ?? {})) {
    if (!symbol) continue;
    const n = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
    cleanedCaps[symbol.toUpperCase()] = n;
  }

  try {
    await prisma.landManagerConfig.upsert({
      where: { player: auth.username },
      update: {
        donation_enabled: donation.enabled,
        donation_pct: pct,
        donation_daily_caps_json: cleanedCaps,
      },
      create: {
        player: auth.username,
        enabled_regions: [],
        donation_enabled: donation.enabled,
        donation_pct: pct,
        donation_daily_caps_json: cleanedCaps,
      },
    });
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: msg };
  }
}

export async function saveRentalConfig(
  rental: RentalConfig
): Promise<{ success: boolean; error?: string }> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    await prisma.landManagerConfig.upsert({
      where: { player: auth.username },
      update: {
        rental_strategy: rental.strategy,
        rental_max_total_dec: rental.max_total_dec,
        rental_max_dec_per_day_per_worker: rental.max_dec_per_day_per_worker,
        rental_min_land_base_pp: rental.min_land_base_pp,
        rental_min_foil: rental.min_foil,
        rental_batch_size: rental.rental_batch_size ?? null,
        rental_land_renters_only: rental.land_renters_only,
      },
      create: {
        player: auth.username,
        enabled_regions: [],
        rental_strategy: rental.strategy,
        rental_max_total_dec: rental.max_total_dec,
        rental_max_dec_per_day_per_worker: rental.max_dec_per_day_per_worker,
        rental_min_land_base_pp: rental.min_land_base_pp,
        rental_min_foil: rental.min_foil,
        rental_batch_size: rental.rental_batch_size ?? null,
        rental_land_renters_only: rental.land_renters_only,
      },
    });
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: msg };
  }
}

export async function saveMakeHarvestableStrategies(
  strategies: MakeHarvestableStrategy[]
): Promise<{ success: boolean; error?: string }> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    await prisma.landManagerConfig.upsert({
      where: { player: auth.username },
      update: { make_harvestable_strategies: strategies },
      create: {
        player: auth.username,
        enabled_regions: [],
        make_harvestable_strategies: strategies,
      },
    });
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: msg };
  }
}
export async function savePostHarvestStrategy(
  strategy: PostHarvestStrategy,
  sellPct?: number,
  poolPct?: number
): Promise<{ success: boolean; error?: string }> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) {
    return { success: false, error: "Not authenticated" };
  }

  let s: number | undefined;
  let p: number | undefined;

  if (
    strategy === "sell_and_pool" &&
    sellPct !== undefined &&
    poolPct !== undefined
  ) {
    s = Math.max(0, Math.min(100, Math.floor(sellPct)));
    p = Math.max(0, Math.min(100, Math.floor(poolPct)));
    if (s + p > 100) {
      return {
        success: false,
        error: "Sell% + Pool% cannot exceed 100",
      };
    }
  }

  try {
    await prisma.landManagerConfig.upsert({
      where: { player: auth.username },
      update: {
        post_harvest_strategy: strategy,
        ...(s !== undefined && { post_harvest_sell_pct: s }),
        ...(p !== undefined && { post_harvest_pool_pct: p }),
      },
      create: {
        player: auth.username,
        enabled_regions: [],
        post_harvest_strategy: strategy,
        ...(s !== undefined && { post_harvest_sell_pct: s }),
        ...(p !== undefined && { post_harvest_pool_pct: p }),
      },
    });
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: msg };
  }
}

export async function savePostHarvestExcludedResources(
  excluded: string[]
): Promise<{ success: boolean; error?: string }> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    await prisma.landManagerConfig.upsert({
      where: { player: auth.username },
      update: { post_harvest_excluded_resources: excluded },
      create: {
        player: auth.username,
        enabled_regions: [],
        post_harvest_excluded_resources: excluded,
      },
    });
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: msg };
  }
}

export async function saveLandManagerConfig(
  enabledRegions: number[]
): Promise<{ success: boolean; error?: string }> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    await prisma.landManagerConfig.upsert({
      where: { player: auth.username },
      update: { enabled_regions: enabledRegions },
      create: { player: auth.username, enabled_regions: enabledRegions },
    });
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: msg };
  }
}
