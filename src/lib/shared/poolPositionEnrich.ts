import type { PlayerTradeHubPosition } from "@/generated/prisma/client";
import { SplLandPool } from "@/types/spl/landPools";

/**
 * Fills in a player's share of one land pool (share %, DEC and resource
 * quantity) from the pool totals. Mutates `playerTradeHubPosition`.
 * Shared by the trade-hub worker and the browser's player dashboard.
 */
export function enrichPoolData(
  playerTradeHubPosition: PlayerTradeHubPosition,
  today: Date,
  metrics: SplLandPool[]
) {
  playerTradeHubPosition.date = today;
  const resource = playerTradeHubPosition.token.split("-")[1];
  const metric = metrics.find((m) => m.token_symbol === resource);

  const totalShares = Number(metric?.total_shares ?? 0);
  const totalDEC = Number(metric?.dec_quantity ?? 0);
  const totalResource = Number(metric?.resource_quantity ?? 0);

  const sharePercentage =
    totalShares > 0 ? playerTradeHubPosition.balance / totalShares : 0;

  playerTradeHubPosition.share_percentage = sharePercentage * 100;
  playerTradeHubPosition.dec_quantity = totalDEC * sharePercentage;
  playerTradeHubPosition.resource_quantity = totalResource * sharePercentage;
}
