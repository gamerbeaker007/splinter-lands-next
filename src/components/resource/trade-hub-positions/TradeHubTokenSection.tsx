"use client";

import { PlayerTradeHubPosition } from "@/generated/prisma";
import { Box } from "@mui/material";
import { TradeHubTokenShareChart } from "@/components/resource/trade-hub-positions/TradeHubTokenShareChart";
import { TradeHubRankingList } from "@/components/resource/trade-hub-positions/TradeHubRankingList";

type Props = {
  token: string;
  playerTradeHubPositions: PlayerTradeHubPosition[];
  currentPlayer?: string;
};

export function TradeHubTokenSection({
  token,
  playerTradeHubPositions,
  currentPlayer,
}: Props) {
  const currentPlayerData = currentPlayer
    ? playerTradeHubPositions.find((p) => p.player === currentPlayer)
    : null;

  const sorted = [...playerTradeHubPositions]
    .filter((p) => typeof p.share_percentage === "number")
    .sort((a, b) => b.share_percentage - a.share_percentage);

  const top200 = sorted.slice(0, 200);

  const currentPlayerRank =
    sorted.findIndex((p) => p.player === (currentPlayerData?.player ?? "")) + 1;

  return (
    <Box display={"flex"} flexWrap={"wrap"} flexDirection={"column"} gap={2}>
      <Box
        minWidth={{ xs: "100%", sm: 350 }}
        maxWidth={{ xs: "100%", sm: 900 }}
        height={700}
      >
        <TradeHubTokenShareChart
          playerTradeHubPositions={playerTradeHubPositions}
          currentPlayerData={currentPlayerData}
        />
      </Box>
      <Box
        minWidth={{ xs: "100%", sm: 350 }}
        maxWidth={{ xs: "100%", sm: 900 }}
        maxHeight={800}
        mt={2}
      >
        <TradeHubRankingList
          tokePair={token}
          listData={top200}
          currentPlayerRank={currentPlayerRank}
          currentPlayerData={currentPlayerData}
        />
      </Box>
    </Box>
  );
}
