"use server";

import { Resource } from "@/constants/resource/resource";
import { getCachedRegionDataSSR } from "@/lib/backend/api/internal/deed-data";
import { filterDeeds } from "@/lib/filters";
import { calcCostsV2 } from "@/lib/shared/costCalc";
import { ResourceRecipeItem, TAX_RATE } from "@/lib/shared/statics";
import { DeedComplete } from "@/types/deed";
import { FilterInput } from "@/types/filters";

export type PlayerProduction = {
  player: string;
  production: number; // including taxes
  consumed: number;
  rank: number;
  total: number;
  netProduction: number;
  netRank: number;
};

const LIMIT_TOP_PLAYERS = 100;

export type ResourceLeaderboard = {
  resource: Resource;
  top: PlayerProduction[];
  topNet: PlayerProduction[];
  playerInfo?: PlayerProduction;
  total: number;
  totalConsumed?: number;
  totalNet?: number;
};

/**
 * Get production leaderboard data based on filters and user.
 * Returns top x players per resource and specific player info if provided.
 */
export async function getProductionLeaderboard(
  filters: FilterInput,
  player?: string | null
): Promise<ResourceLeaderboard[]> {
  const deeds = await getCachedRegionDataSSR();
  const filteredDeeds = filterDeeds(deeds, filters);

  // Aggregate production per player per resource
  const {
    productionPerPlayerPerResource,
    consumedPerPlayerPerResource,
    totalProductionPerResource,
    totalConsumedPerResource,
  } = aggregatePlayerProduction(filteredDeeds);

  // Process each resource: sort, rank, and slice top players
  const leaderboards: ResourceLeaderboard[] = [];

  for (const [resource, playerProductions] of Object.entries(
    productionPerPlayerPerResource
  )) {
    const consumedForResource =
      consumedPerPlayerPerResource[resource as Resource] || {};

    // Build player data with production, consumed, and net values
    const playerData = Object.keys(playerProductions).map((playerName) => ({
      player: playerName,
      production: playerProductions[playerName],
      consumed: consumedForResource[playerName] || 0,
      netProduction:
        playerProductions[playerName] - (consumedForResource[playerName] || 0),
      rank: 0,
      netRank: 0,
      total: 0,
    }));

    // Create ranked leaderboards for both production and net production
    const { sortedByProduction, sortedByNet } =
      createRankedLeaderboards(playerData);

    // Get top players for both leaderboards
    const top = sortedByProduction.slice(0, LIMIT_TOP_PLAYERS);
    const topNet = sortedByNet.slice(0, LIMIT_TOP_PLAYERS);

    // Find specific player info if requested
    const playerInfo = player
      ? sortedByProduction.find((p) => p.player === player)
      : undefined;

    // Calculate total net production
    const totalNet = playerData.reduce((sum, p) => sum + p.netProduction, 0);

    leaderboards.push({
      resource: resource as Resource,
      top,
      topNet,
      playerInfo,
      total: totalProductionPerResource[resource as Resource] || 0,
      totalConsumed: totalConsumedPerResource[resource as Resource] || 0,
      totalNet,
    });
  }

  return leaderboards;
}

/**
 * aggregate production and consumption per player per resource
 * @param filteredDeeds
 * @returns
 */
function aggregatePlayerProduction(filteredDeeds: DeedComplete[]) {
  const productionPerPlayerPerResource: Partial<
    Record<Resource, Record<string, number>>
  > = {};
  const consumedPerPlayerPerResource: Partial<
    Record<Resource, Record<string, number>>
  > = {};

  const totalProductionPerResource: Partial<Record<Resource, number>> = {};
  const totalConsumedPerResource: Partial<Record<Resource, number>> = {};

  filteredDeeds.forEach((deed) => {
    const deedOwner = deed.player;
    const resource = deed.worksiteDetail?.token_symbol as Resource;
    const rewardsPerHour = deed.worksiteDetail?.rewards_per_hour ?? 0;
    const rewardsPerHourTaxed = rewardsPerHour - rewardsPerHour * TAX_RATE;

    const basePP = deed.stakingDetail?.total_base_pp_after_cap ?? 0;
    const siteEfficiency = deed.worksiteDetail?.site_efficiency ?? 0;
    const recipe = deed.worksiteDetail
      ?.resource_recipe as unknown as ResourceRecipeItem[];

    // Skip if no owner or resource
    if (!deedOwner || !resource) return;

    // Calculate consumed resources
    const consumedResource = calcCostsV2(basePP, siteEfficiency, recipe);

    // Initialize resource object if needed
    productionPerPlayerPerResource[resource] ??= {};
    // Add or update player production for this resource
    if (productionPerPlayerPerResource[resource][deedOwner]) {
      productionPerPlayerPerResource[resource][deedOwner] +=
        rewardsPerHourTaxed;
    } else {
      productionPerPlayerPerResource[resource][deedOwner] = rewardsPerHourTaxed;
    }

    // for each consumed resource, add to player's consumed total
    Object.entries(consumedResource).forEach(([resourceKey, amount]) => {
      const resource = resourceKey as Resource;
      consumedPerPlayerPerResource[resource] ??= {};
      if (consumedPerPlayerPerResource[resource][deedOwner]) {
        consumedPerPlayerPerResource[resource][deedOwner] += amount;
      } else {
        consumedPerPlayerPerResource[resource][deedOwner] = amount;
      }
      totalConsumedPerResource[resource] =
        (totalConsumedPerResource[resource] || 0) + amount || 0;
    });

    // Always add to total production for this resource
    totalProductionPerResource[resource] =
      (totalProductionPerResource[resource] || 0) + rewardsPerHourTaxed;
  });

  return {
    productionPerPlayerPerResource,
    consumedPerPlayerPerResource,
    totalProductionPerResource,
    totalConsumedPerResource,
  };
}

/**
 * Assign ranks to players based on a value, handling ties
 */
function assignRanks(
  sortedPlayers: PlayerProduction[],
  valueKey: keyof PlayerProduction,
  rankKey: keyof PlayerProduction
): void {
  let currentRank = 1;
  for (let i = 0; i < sortedPlayers.length; i++) {
    if (
      i > 0 &&
      sortedPlayers[i][valueKey] !== sortedPlayers[i - 1][valueKey]
    ) {
      currentRank = i + 1;
    }
    (sortedPlayers[i][rankKey] as number) = currentRank;
  }
}

/**
 * Create ranked leaderboards for both production and net production
 */
function createRankedLeaderboards(playerData: PlayerProduction[]): {
  sortedByProduction: PlayerProduction[];
  sortedByNet: PlayerProduction[];
} {
  // Sort by production (descending)
  const sortedByProduction = [...playerData].sort(
    (a, b) => b.production - a.production
  );
  assignRanks(sortedByProduction, "production", "rank");
  sortedByProduction.forEach((p) => (p.total = sortedByProduction.length));

  // Sort by net production (descending)
  const sortedByNet = [...playerData].sort(
    (a, b) => b.netProduction - a.netProduction
  );
  assignRanks(sortedByNet, "netProduction", "netRank");

  // Cross-apply ranks
  const netRankMap = new Map(sortedByNet.map((p) => [p.player, p.netRank]));
  sortedByProduction.forEach(
    (p) => (p.netRank = netRankMap.get(p.player) || 0)
  );

  const rankMap = new Map(sortedByProduction.map((p) => [p.player, p.rank]));
  sortedByNet.forEach((p) => {
    p.rank = rankMap.get(p.player) || 0;
    p.total = sortedByProduction.length;
  });

  return { sortedByProduction, sortedByNet };
}
