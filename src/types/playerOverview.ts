import { PlayerTradeHubPosition } from "@/generated/prisma/client";
import { DeedAlertsInfo } from "@/types/deedAlertsInfo";
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
};
