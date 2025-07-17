"use client";

import { RankedItemBox } from "@/components/region-overview/RankedItemBox";
import { PlayerTradeHubPosition } from "@/generated/prisma";
import { formatNumberWithSuffix } from "@/lib/formatters";
import { RESOURCE_ICON_MAP } from "@/lib/shared/statics";
import { Box, Card, Typography } from "@mui/material";
import Image from "next/image";

type Props = {
  token: string;
  playerTradeHubPositions: PlayerTradeHubPosition[];
  currentPlayer?: string;
};

export function TradeHubTokenRankingList({
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

  return (
    <Box
      minWidth={{ xs: "100%", sm: 300 }}
      maxWidth={{ xs: "100%", sm: 800 }}
      maxHeight={800}
      my={2}
    >
      <Card sx={{ height: "100%", overflowY: "auto" }}>
        <Box
          sx={{
            position: "sticky",
            top: 0,
            backgroundColor: "background.paper",
            zIndex: 1,
            px: 2,
            py: 1,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Image
            src={RESOURCE_ICON_MAP[token.split("-")[1]]}
            alt=""
            width={50}
            height={50}
          />
          <Typography variant="h5">{token}</Typography>
          {currentPlayerData && (
            <Box px={1}>
              <Typography variant="body2" color="secondary.main" fontSize={14}>
                {currentPlayer} rank:{" "}
                {sorted.findIndex((p) => p.player === currentPlayer) + 1}
              </Typography>
              <Typography variant="body2" fontSize={12}>
                Balance: {formatNumberWithSuffix(currentPlayerData.balance)} -
                Share: {currentPlayerData.share_percentage.toFixed(2)}%
              </Typography>
            </Box>
          )}
        </Box>

        {top200.map((p, i) => (
          <RankedItemBox
            key={`ranked-box-${token}-${p.player}`}
            rank={i + 1}
            value={`${p.share_percentage.toFixed(2)}%`}
            subValue={p.player}
            otherSubValues={[
              `${formatNumberWithSuffix(p.total_fees_earned_dec)} DEC `,
              `${formatNumberWithSuffix(p.total_fees_earned_resource)} Resources`,
            ]}
          />
        ))}
      </Card>
    </Box>
  );
}
