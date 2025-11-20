import { PlayerTradeHubPosition } from "@/generated/prisma";
import { Balance } from "@/types/balance";
import { DeedAlertsInfo } from "@/types/deedAlertsInfo";
import { RegionLiquidityInfo } from "@/types/regionLiquidityInfo";
import { RegionSummary } from "@/types/regionSummary";

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
};
