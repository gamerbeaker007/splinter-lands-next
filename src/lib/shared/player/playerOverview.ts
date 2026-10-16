import type { PlayerTradeHubPosition } from "@/generated/prisma/client";
import {
  calculateLCERatio,
  calculateLDERatio,
  calculateLPERatio,
} from "@/lib/backend/helpers/productionUtils";
import {
  getDeedsAlerts,
  summarizeDeedsData,
} from "@/lib/shared/deedEnrichment";
import { processPlayerRegionInformation } from "@/lib/shared/player/playerRegion";
import { enrichPoolData } from "@/lib/shared/poolPositionEnrich";
import { DeedComplete } from "@/types/deed";
import { PlayerOverview } from "@/types/playerOverview";
import { Prices } from "@/types/price";
import { RegionLiquidityInfo } from "@/types/regionLiquidityInfo";
import { SplBalance } from "@/types/spl/balance";
import { SplLandPool } from "@/types/spl/landPools";

/** Balance tokens (by prefix) shown on the player dashboard. */
export const DASHBOARD_BALANCE_TOKENS = [
  "DEC",
  "SPS",
  "CINDER",
  "VOUCHER",
  "MIDNIGHTPOT",
  "WAGONKIT",
  "AM",
  "FT",
  "POWER_CORE_PURCHASES",
  "ALLOCATION_EARTH_C",
  "ALLOCATION_FIRE_C",
];

/**
 * The parts of the dashboard that need the server's region-wide DB data:
 * the global base PP (for the land share) and the player's tax income.
 * See `getPlayerOverviewGlobals`.
 */
export interface PlayerOverviewGlobals {
  totalBasePP: number;
  totalBasePPIncludingEfficiency: number;
  totalTaxDec: number | null;
}

export interface PlayerOverviewInput {
  /** The player's deeds, already enriched with progress info. */
  deeds: DeedComplete[];
  liquidityInfo: RegionLiquidityInfo[];
  poolInfo: PlayerTradeHubPosition[];
  landPools: SplLandPool[];
  balances: SplBalance[];
  resourcePrices: Prices;
  globals: PlayerOverviewGlobals;
}

/**
 * Builds the player dashboard from the player's own SPL reads (made in the
 * browser) plus the server-computed globals. Pure.
 */
export function buildPlayerOverview({
  deeds,
  liquidityInfo,
  poolInfo,
  landPools,
  balances,
  resourcePrices,
  globals,
}: PlayerOverviewInput): PlayerOverview {
  const summarizedRegionInfo = summarizeDeedsData(deeds);
  const alerts = getDeedsAlerts(deeds);

  const today = new Date();
  poolInfo.forEach((row) => enrichPoolData(row, today, landPools));

  //DEC Income
  const playerRegionInfo = processPlayerRegionInformation(
    deeds,
    resourcePrices
  );
  const total_dec = playerRegionInfo.totals.totalDEC;

  const LDE_ratio = calculateLDERatio(
    total_dec,
    summarizedRegionInfo.totalDecInUse
  );
  const LCE_ratio_base = calculateLCERatio(
    total_dec,
    summarizedRegionInfo.totalBasePP
  );
  const LCE_ratio_boosted = calculateLCERatio(
    total_dec,
    summarizedRegionInfo.totalBoostedPP
  );
  const LPE_ratio = calculateLPERatio(
    total_dec,
    summarizedRegionInfo.deedsCount
  );

  const { totalBasePP, totalBasePPIncludingEfficiency } = globals;

  let totalPlayerBasePP = 0;
  let totalPlayerBasePPIncludingEfficiency = 0;
  for (const deed of deeds) {
    const basePP = deed?.stakingDetail?.total_base_pp_after_cap || 0;
    const siteEfficiency = deed?.worksiteDetail?.site_efficiency || 0;
    totalPlayerBasePP += basePP;
    totalPlayerBasePPIncludingEfficiency += basePP * siteEfficiency;
  }

  const playerLandSharePct = totalPlayerBasePP / totalBasePP;
  const playerLandShareInclEfficiencyPct =
    totalPlayerBasePPIncludingEfficiency / totalBasePPIncludingEfficiency;
  const playerLandSharePctAt100 =
    totalPlayerBasePP / totalBasePPIncludingEfficiency;

  return {
    summarizedRegionInfo: summarizedRegionInfo,
    liquidityInfo: liquidityInfo,
    liquidityPoolInfo: poolInfo,
    balances: balances,
    alerts: alerts,
    LCERatioBase: LCE_ratio_base,
    LCERatioBoosted: LCE_ratio_boosted,
    LDERatio: LDE_ratio,
    LPERatio: LPE_ratio,
    totalDec: total_dec,
    totalTaxDec: globals.totalTaxDec,
    landShare: {
      totalBasePP,
      totalBasePPIncludingEfficiency,
      totalPlayerBasePP,
      totalPlayerBasePPIncludingEfficiency,
      playerLandShare: playerLandSharePct,
      playerLandShareInclEfficiency: playerLandShareInclEfficiencyPct,
      eligible: {
        common: playerLandShareInclEfficiencyPct * 60_000,
        // rare: playerLandShareInclEfficiencyPct * 18_000,
        // epic: playerLandShareInclEfficiencyPct * 6_000,
        // legendary: playerLandShareInclEfficiencyPct * 1_000,
      },
      eligibleAt100: {
        common: playerLandSharePctAt100 * 60_000,
        // rare: playerLandSharePctAt100 * 18_000,
        // epic: playerLandSharePctAt100 * 6_000,
        // legendary: playerLandSharePctAt100 * 1_000,
      },
    },
  };
}
