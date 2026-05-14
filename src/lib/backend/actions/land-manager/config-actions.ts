"use server";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_MAKE_HARVESTABLE_STRATEGIES,
  DEFAULT_POST_HARVEST_EXCLUDED_RESOURCES,
  DEFAULT_POST_HARVEST_STRATEGY,
  LandManagerConfig,
  MakeHarvestableStrategy,
  PostHarvestStrategy,
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
    fee_accepted: row?.fee_accepted ?? false,
    post_harvest_strategy:
      (row?.post_harvest_strategy as PostHarvestStrategy) ??
      DEFAULT_POST_HARVEST_STRATEGY,
    post_harvest_excluded_resources:
      (row?.post_harvest_excluded_resources as string[]) ??
      DEFAULT_POST_HARVEST_EXCLUDED_RESOURCES,
    mythic_fee_accepted: row?.mythic_fee_accepted ?? false,
  };
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
  strategy: PostHarvestStrategy
): Promise<{ success: boolean; error?: string }> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    await prisma.landManagerConfig.upsert({
      where: { player: auth.username },
      update: { post_harvest_strategy: strategy },
      create: {
        player: auth.username,
        enabled_regions: [],
        post_harvest_strategy: strategy,
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

export async function saveMythicFeeAccepted(): Promise<void> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) return;

  await prisma.landManagerConfig.upsert({
    where: { player: auth.username },
    update: { mythic_fee_accepted: true },
    create: {
      player: auth.username,
      enabled_regions: [],
      mythic_fee_accepted: true,
    },
  });
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
