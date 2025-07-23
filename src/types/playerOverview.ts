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
};
