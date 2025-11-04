import { RegionSummary } from "@/types/regionSummary";
import { RegionLiquidityInfo } from "@/types/regionLiquidityInfo";
import { PlayerTradeHubPosition } from "@/generated/prisma";
import { Balance } from "@/types/balance";
import { DeedAlertsInfo } from "@/types/deedAlertsInfo";

export type PlayerOverview = {
  summarizedRegionInfo: RegionSummary;
  liquidityInfo: RegionLiquidityInfo[];
  liquidityPoolInfo: PlayerTradeHubPosition[];
  balances: Balance[];
  alerts: DeedAlertsInfo[];
  LCERatioBase: number;
  LCERatioBoosted: number;
  LPERatio: number;
  LDERatio: number;
  totalDec: number;
  totalTaxDec: number | null;
  landShare?: {
    totalBasePP: number;
    totalBasePPIncludingEfficiency: number;
    totalPlayerBasePP: number;
    totalPlayerBasePPIncludingEfficiency: number;
    playerLandShare: number;
    playerLandShareInclEfficiency: number;
    eligible: {
      common: number;
      rare: number;
      epic: number;
      legendary: number;
    };
  };
};
