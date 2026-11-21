"use client";

import { PlayerTradeHubPosition } from "@/generated/prisma/client";
import { Box } from "@mui/material";
import { TradeHubTokenShareChart } from "@/components/resource/trade-hub-positions/TradeHubTokenShareChart";
import { TradeHubRankingList } from "@/components/resource/trade-hub-positions/TradeHubRankingList";
import { playerPoolStanding } from "@/components/resource/trade-hub-positions/poolRankings";

type Props = {
  token: string;
  playerTradeHubPositions: PlayerTradeHubPosition[];
  rankedPositions: PlayerTradeHubPosition[];
  currentPlayer?: string;
};

export function TradeHubTokenSection({
  token,
  playerTradeHubPositions,
  rankedPositions,
  currentPlayer,
}: Props) {
  const { position: currentPlayerData, rank } = playerPoolStanding(
    playerTradeHubPositions,
    rankedPositions,
    currentPlayer ?? ""
  );

  return (
    <Box display={"flex"} flexWrap={"wrap"} flexDirection={"column"} gap={2}>
      <Box
        minWidth={{ xs: "100%", sm: 400 }}
        maxWidth={{ xs: "100%", sm: 900 }}
        height={700}
      >
        <TradeHubTokenShareChart
          playerTradeHubPositions={playerTradeHubPositions}
          currentPlayerData={currentPlayerData}
        />
      </Box>
      <Box
        minWidth={{ xs: "100%", sm: 400 }}
        maxWidth={{ xs: "100%", sm: 900 }}
        maxHeight={800}
        mt={2}
      >
        <TradeHubRankingList
          tokePair={token}
          listData={rankedPositions.slice(0, 200)}
          currentPlayerRank={rank ?? 0}
          currentPlayerData={currentPlayerData}
        />
      </Box>
    </Box>
  );
}
