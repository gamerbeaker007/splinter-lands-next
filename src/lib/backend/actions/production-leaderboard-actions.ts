"use server";

import { FilterInput } from "@/types/filters";
import { getCachedRegionDataSSR } from "@/lib/backend/api/internal/deed-data";
import { filterDeeds } from "@/lib/filters";
import { Resource } from "@/constants/resource/resource";

export type PlayerProduction = {
  player: string;
  production: number;
  rank: number;
  total: number;
};

const LIMIT_TOP_PLAYERS = 100;

export type ResourceLeaderboard = {
  resource: Resource;
  top: PlayerProduction[];
  playerInfo?: PlayerProduction;
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
  const productionPerPlayerPerResource: Partial<
    Record<Resource, Record<string, number>>
  > = {};

  filteredDeeds.forEach((deed) => {
    const deedOwner = deed.player;
    const resource = deed.worksiteDetail?.token_symbol as Resource;
    const rewardsPerHour = deed.worksiteDetail?.rewards_per_hour ?? 0;

    // Skip if no owner or resource
    if (!deedOwner || !resource) return;

    // Initialize resource object if needed
    productionPerPlayerPerResource[resource] ??= {};

    // Add or update player production for this resource
    if (productionPerPlayerPerResource[resource][deedOwner]) {
      productionPerPlayerPerResource[resource][deedOwner] += rewardsPerHour;
    } else {
      productionPerPlayerPerResource[resource][deedOwner] = rewardsPerHour;
    }
  });

  // Process each resource: sort, rank, and slice top 50
  const leaderboards: ResourceLeaderboard[] = [];

  for (const [resource, playerProductions] of Object.entries(
    productionPerPlayerPerResource
  )) {
    // Convert to array and sort by production (descending)
    const sortedPlayers = Object.entries(playerProductions)
      .map(([playerName, production]) => ({
        player: playerName,
        production,
        rank: 0, // Will be assigned below
        total: 0,
      }))
      .sort((a, b) => b.production - a.production);

    // Assign ranks (handle ties)
    let currentRank = 1;
    for (let i = 0; i < sortedPlayers.length; i++) {
      if (
        i > 0 &&
        sortedPlayers[i].production !== sortedPlayers[i - 1].production
      ) {
        currentRank = i + 1;
      }
      sortedPlayers[i].rank = currentRank;
      sortedPlayers[i].total = sortedPlayers.length;
    }

    // Get top x
    const top = sortedPlayers.slice(0, LIMIT_TOP_PLAYERS);

    // Find specific player info if requested
    let playerInfo: PlayerProduction | undefined;
    if (player) {
      playerInfo = sortedPlayers.find((p) => p.player === player);
    }

    leaderboards.push({
      resource: resource as Resource,
      top,
      playerInfo,
    });
  }

  return leaderboards;
}
