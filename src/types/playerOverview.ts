import { PlayerTradeHubPosition } from "@/generated/prisma/client";
import { DeedAlertsInfo } from "@/types/deedAlertsInfo";
import { CardRarity } from "@/types/planner";
import { RegionLiquidityInfo } from "@/types/regionLiquidityInfo";
import { RegionSummary } from "@/types/regionSummary";
import { SplBalance } from "@/types/spl/balance";

export type PlayerOverview = {
  summarizedRegionInfo: RegionSummary;
  liquidityInfo: RegionLiquidityInfo[];
  liquidityPoolInfo: PlayerTradeHubPosition[];
  balances: SplBalance[];
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
    eligible: { [key in CardRarity]: number };
    eligibleAt100: { [key in CardRarity]: number };
  };
};
