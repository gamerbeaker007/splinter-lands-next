"use server";

import { getCachedRegionDataSSR } from "@/lib/backend/api/internal/deed-data";
import logger from "@/lib/backend/log/logger.server";
import { filterDeeds } from "@/lib/filters";
import { FilterInput } from "@/types/filters";
import {
  InactiveDeedInfo,
  InactivityAnalysis,
  InactivityBucket,
  IncorrectDeedInfo,
  PlayerInactivityRanking,
} from "@/types/inactivity";

const HOURS_PER_WEEK = 168;
const TWO_WEEKS_HOURS = 2 * HOURS_PER_WEEK;

/**
 * Analyzes deed inactivity across all regions
 * Returns categorized data about inactive deeds, player rankings, and incorrect deed configurations
 */
export async function getInactivityAnalysis(
  filters: FilterInput
): Promise<InactivityAnalysis> {
  try {
    // Fetch all deed data from the database
    const allDeeds = await getCachedRegionDataSSR();
    const filteredDeeds = filterDeeds(allDeeds, filters);

    // Filter deeds with rewards_per_hour > 0
    const deedsWithRewards = filteredDeeds.filter(
      (deed) =>
        deed.worksiteDetail &&
        deed.worksiteDetail.rewards_per_hour !== null &&
        deed.worksiteDetail.rewards_per_hour > 0
    );

    // Categorize active vs inactive
    const activeDeeds = deedsWithRewards.filter(
      (deed) =>
        deed.worksiteDetail!.hours_since_last_op !== null &&
        deed.worksiteDetail!.hours_since_last_op < TWO_WEEKS_HOURS
    );

    const inactiveDeeds = deedsWithRewards.filter(
      (deed) =>
        deed.worksiteDetail!.hours_since_last_op !== null &&
        deed.worksiteDetail!.hours_since_last_op >= TWO_WEEKS_HOURS
    );

    // Define inactivity buckets
    const bucketDefinitions = [
      { label: "2 weeks - 1 month", minWeeks: 2, maxWeeks: 4 },
      { label: "1-2 months", minWeeks: 4, maxWeeks: 8 },
      { label: "2-3 months", minWeeks: 8, maxWeeks: 12 },
      { label: "3-4 months", minWeeks: 12, maxWeeks: 16 },
      { label: "4-5 months", minWeeks: 16, maxWeeks: 20 },
      { label: "5-6 months", minWeeks: 20, maxWeeks: 24 },
      { label: "6-7 months", minWeeks: 24, maxWeeks: 28 },
      { label: "7-8 months", minWeeks: 28, maxWeeks: 32 },
      { label: "8-9 months", minWeeks: 32, maxWeeks: 36 },
      { label: "9-10 months", minWeeks: 36, maxWeeks: 40 },
      { label: "10-11 months", minWeeks: 40, maxWeeks: 44 },
      { label: "11-12 months", minWeeks: 44, maxWeeks: 48 },
      { label: "12+ months", minWeeks: 48, maxWeeks: undefined },
    ];

    // Populate buckets
    const buckets: InactivityBucket[] = bucketDefinitions.map((def) => {
      const bucketDeeds = inactiveDeeds.filter((deed) => {
        const hours = deed.worksiteDetail!.hours_since_last_op!;
        const weeks = hours / HOURS_PER_WEEK;
        return (
          weeks >= def.minWeeks &&
          (def.maxWeeks === undefined || weeks < def.maxWeeks)
        );
      });

      const deedInfos: InactiveDeedInfo[] = bucketDeeds.map((deed) => ({
        deed_uid: deed.deed_uid,
        player: deed.player,
        region_name: deed.region_name,
        region_uid: deed.region_uid,
        plot_id: deed.plot_id,
        resource_symbol: deed.resource_symbol,
        worksite_resource_token: deed.worksiteDetail?.token_symbol || null,
        rewards_per_hour: deed.worksiteDetail!.rewards_per_hour!,
        hours_since_last_op: deed.worksiteDetail!.hours_since_last_op!,
        weeks_inactive:
          deed.worksiteDetail!.hours_since_last_op! / HOURS_PER_WEEK,
      }));

      return {
        label: def.label,
        minWeeks: def.minWeeks,
        maxWeeks: def.maxWeeks,
        count: bucketDeeds.length,
        deeds: deedInfos,
      };
    });

    // Calculate player rankings
    const playerMap = new Map<
      string,
      {
        totalDeeds: number;
        inactiveDeeds: number;
        totalInactiveHours: number;
      }
    >();

    deedsWithRewards.forEach((deed) => {
      if (!deed.player) return;

      if (!playerMap.has(deed.player)) {
        playerMap.set(deed.player, {
          totalDeeds: 0,
          inactiveDeeds: 0,
          totalInactiveHours: 0,
        });
      }

      const stats = playerMap.get(deed.player)!;
      stats.totalDeeds++;

      const hours = deed.worksiteDetail!.hours_since_last_op;
      if (hours !== null && hours >= TWO_WEEKS_HOURS) {
        stats.inactiveDeeds++;
        stats.totalInactiveHours += hours;
      }
    });

    const playerRankings: PlayerInactivityRanking[] = Array.from(
      playerMap.entries()
    )
      .filter(([, stats]) => stats.inactiveDeeds > 0)
      .map(([player, stats]) => ({
        player,
        totalDeeds: stats.totalDeeds,
        inactiveDeeds: stats.inactiveDeeds,
        averageInactiveWeeks:
          stats.totalInactiveHours / stats.inactiveDeeds / HOURS_PER_WEEK,
      }))
      .sort((a, b) => b.inactiveDeeds - a.inactiveDeeds);

    // Find incorrect deeds (worksite.token_symbol != deed.resource_symbol)
    const incorrectDeeds: IncorrectDeedInfo[] = allDeeds
      .filter(
        (deed) =>
          deed.worksiteDetail &&
          deed.resource_symbol &&
          deed.worksiteDetail.token_symbol &&
          deed.worksiteDetail.token_symbol !== deed.resource_symbol
      )
      .map((deed) => ({
        deed_uid: deed.deed_uid,
        player: deed.player,
        region_name: deed.region_name,
        plot_id: deed.plot_id,
        deed_resource_symbol: deed.resource_symbol,
        worksite_resource_token: deed.worksiteDetail!.token_symbol,
        hours_since_last_op: deed.worksiteDetail!.hours_since_last_op,
      }));

    return {
      totalDeeds: allDeeds.length,
      totalWithRewards: deedsWithRewards.length,
      activeDeeds: activeDeeds.length,
      inactiveDeeds: inactiveDeeds.length,
      buckets,
      playerRankings,
      incorrectDeeds,
    };
  } catch (error) {
    logger.error("Failed to analyze inactivity", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to analyze inactivity"
    );
  }
}
