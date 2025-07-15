import { logError } from "@/lib/backend/log/logUtils";
import { NextResponse } from "next/server";
import { getPlayerProductionData } from "@/lib/backend/api/internal/player-production-data";
import { getCachedRegionData } from "@/lib/backend/api/internal/deed-data";
import { PlayerProductionSummaryEnriched } from "@/types/PlayerProductionSummaryEnriched";
import { DeedComplete } from "@/types/deed";

type StakeInfo = {
  totalDecStakeNeeded: number;
  totalDecStakeInUse: number;
  totalDecStaked: number;
};

function aggregateStakingInfo(
  regionData: DeedComplete[],
): Map<string, StakeInfo> {
  const stakeMap = new Map<string, StakeInfo>();
  const seenPairs = new Set<string>();

  for (const deed of regionData) {
    const player = deed.player!;
    const regionUid = deed.region_uid!;
    const key = `${regionUid}-${player}`;

    const totalDecStakeNeeded = deed.stakingDetail?.total_dec_stake_needed ?? 0;
    const totalDecStakeInUse = deed.stakingDetail?.total_dec_stake_in_use ?? 0;

    //staked DEC is based on region only add it one per region-player combination
    const totalDecStaked = !seenPairs.has(key)
      ? (deed.stakingDetail?.total_dec_staked ?? 0)
      : 0;
    seenPairs.add(key);

    const current = stakeMap.get(player) || {
      totalDecStakeNeeded: 0,
      totalDecStakeInUse: 0,
      totalDecStaked: 0,
    };
    stakeMap.set(player, {
      totalDecStakeNeeded: current.totalDecStakeNeeded + totalDecStakeNeeded,
      totalDecStakeInUse: current.totalDecStakeInUse + totalDecStakeInUse,
      totalDecStaked: current.totalDecStaked + totalDecStaked,
    });
  }

  return stakeMap;
}

function applyStakingDataToPlayers(
  players: PlayerProductionSummaryEnriched[],
  stakeMap: Map<string, StakeInfo>,
) {
  for (const player of players) {
    const stakeData = stakeMap.get(player.player) || {
      totalDecStakeNeeded: 0,
      totalDecStakeInUse: 0,
      totalDecStaked: 0,
    };
    player.total_dec_stake_needed = stakeData.totalDecStakeNeeded;
    player.total_dec_stake_in_use = stakeData.totalDecStakeInUse;
    player.total_dec_staked = stakeData.totalDecStaked;
  }
}

function assignRank(
  players: PlayerProductionSummaryEnriched[],
  field: keyof PlayerProductionSummaryEnriched,
  rankField: string,
): void {
  const sorted = [...players]
    .filter((p) => isFinite(p[field] as number))
    .sort((a, b) => (b[field] as number) - (a[field] as number));

  const rankMap: Partial<Record<string, number>> = {};
  let rank = 1;

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const prev = sorted[i - 1];
    if (i > 0 && current[field] !== prev[field]) {
      rank = i + 1;
    }
    rankMap[current.player] = rank;
  }

  for (const player of players) {
    (player as unknown as Record<string, number | null>)[rankField] =
      rankMap[player.player] ?? null;
  }
}

function normalizeRatio(
  players: PlayerProductionSummaryEnriched[],
  field: keyof PlayerProductionSummaryEnriched,
  targetField: string,
  scale = 1000,
) {
  const values = players
    .map((p) => p[field] as number)
    .filter((v) => isFinite(v));
  const min = Math.min(...values);
  const max = Math.max(...values);

  for (const player of players) {
    const raw = player[field] as number;
    const norm = isFinite(raw) ? ((raw - min) / (max - min)) * scale : 0;
    (player as unknown as Record<string, number | null>)[targetField] = norm;
  }
}

function calculateRatios(players: PlayerProductionSummaryEnriched[]) {
  const epsilon = 1e-6;

  // --- Ratios
  for (const player of players) {
    player.LDE_ratio = Math.log10(
      player.total_dec / ((player.total_dec_stake_in_use ?? 0) + epsilon),
    );
    player.LCE_ratio_base = Math.log10(
      player.total_dec / (player.total_base_pp_after_cap + epsilon),
    );
    player.LCE_ratio_boosted = Math.log10(
      player.total_dec / (player.total_harvest_pp + epsilon),
    );
    player.LPE_ratio = player.total_dec / player.count;
  }
}

function calculateRanks(players: PlayerProductionSummaryEnriched[]) {
  // --- Ranks
  assignRank(players, "LCE_ratio_base", "LCE_base_rank");
  assignRank(players, "LCE_ratio_boosted", "LCE_boosted_rank");
  assignRank(players, "LPE_ratio", "LPE_rank");
  assignRank(players, "LDE_ratio", "LDE_rank");
  assignRank(players, "total_dec", "total_dec_rank");
  assignRank(players, "total_dec_staked", "total_dec_staked_rank");
  assignRank(players, "count", "count_rank");
  assignRank(players, "total_harvest_pp", "total_harvest_pp_rank");
  assignRank(players, "total_land_score", "total_land_rank");
}

function normalizeRatios(players: PlayerProductionSummaryEnriched[]) {
  normalizeRatio(players, "LDE_ratio", "LDE_score", 100);
  normalizeRatio(players, "LCE_ratio_base", "LCE_base_score", 100);
  normalizeRatio(players, "LCE_ratio_boosted", "LCE_boosted_score", 100);
  normalizeRatio(players, "LPE_ratio", "LPE_score", 100);
}

function calculateTotalLandScore(players: PlayerProductionSummaryEnriched[]) {
  for (const player of players) {
    player.total_land_score =
      ((player.LDE_score ?? 0) +
        (player.LPE_score ?? 0) +
        (player.LCE_boosted_score ?? 0)) /
      3;
  }
}

export async function GET() {
  try {
    const playerSummaryData: PlayerProductionSummaryEnriched[] =
      await getPlayerProductionData();
    const regionData = await getCachedRegionData();

    const stakeMap = aggregateStakingInfo(regionData);
    applyStakingDataToPlayers(playerSummaryData, stakeMap);
    calculateRatios(playerSummaryData);
    normalizeRatios(playerSummaryData);
    calculateTotalLandScore(playerSummaryData);
    calculateRanks(playerSummaryData);

    return NextResponse.json(playerSummaryData, { status: 200 });
  } catch (err) {
    logError("Failed to load data", err);
    return NextResponse.json({ error: "Failed to load data" }, { status: 501 });
  }
}
