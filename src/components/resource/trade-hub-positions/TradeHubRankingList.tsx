import { RankedItemBox } from "@/components/region-overview/RankedItemBox";
import { PoolIcon } from "@/components/resource/trade-hub-positions/PoolIcon";
import { PlayerTradeHubPosition } from "@/generated/prisma/client";
import { formatNumberWithSuffix } from "@/lib/formatters";
import { Box, Card, Typography } from "@mui/material";

type Props = {
  tokePair: string;
  listData: PlayerTradeHubPosition[];
  currentPlayerRank?: number;
  currentPlayerData?: PlayerTradeHubPosition | null | undefined;
};

export function TradeHubRankingList({
  tokePair,
  listData,
  currentPlayerRank,
  currentPlayerData,
}: Props) {
  return (
    <Card sx={{ height: "100%", overflow: "auto" }}>
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
        <PoolIcon resource={tokePair.split("-")[1]} width={30} height={30} />
        <Typography variant="h5">{tokePair}</Typography>

        {currentPlayerData && (
          <Box px={1}>
            <Typography variant="body2" color="secondary.main" fontSize={14}>
              {currentPlayerData.player} rank:{currentPlayerRank}
            </Typography>
            <Typography variant="body2" fontSize={12}>
              {formatNumberWithSuffix(currentPlayerData.dec_quantity)}-
              {formatNumberWithSuffix(currentPlayerData.resource_quantity)}{" "}
              Share: {currentPlayerData.share_percentage.toFixed(2)}%
            </Typography>
          </Box>
        )}
      </Box>

      {/* RANKING BOXES */}
      {listData.map((p, i) => (
        <RankedItemBox
          key={`ranked-box-${tokePair}-${p.player}`}
          rank={i + 1}
          value={`${p.share_percentage.toFixed(2)}%`}
          subValue={p.player}
          otherSubValues={[
            formatNumberWithSuffix(p.dec_quantity),
            formatNumberWithSuffix(p.resource_quantity),
          ]}
        />
      ))}
    </Card>
  );
}
