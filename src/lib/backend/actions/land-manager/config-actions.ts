"use server";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_MAKE_HARVESTABLE_STRATEGIES,
  LandManagerConfig,
  MakeHarvestableStrategy,
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
