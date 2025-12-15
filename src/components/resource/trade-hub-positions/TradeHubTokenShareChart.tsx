"use client";

import { InfoItem } from "@/components/resource/trade-hub-positions/InfoItem";
import { PoolIcon } from "@/components/resource/trade-hub-positions/PoolIcon";
import { FullscreenPlotWrapper } from "@/components/ui/graph/FullscreenPlotWrapper";
import { PlayerTradeHubPosition } from "@/generated/prisma/client";
import { formatNumberWithSuffix } from "@/lib/formatters";
import { Box } from "@mui/system";

type Props = {
  playerTradeHubPositions: PlayerTradeHubPosition[];
  currentPlayerData?: PlayerTradeHubPosition | null | undefined;
};

export function TradeHubTokenShareChart({
  playerTradeHubPositions,
  currentPlayerData,
}: Props) {
  const totalShare = playerTradeHubPositions.reduce(
    (sum, p) => sum + (p.share_percentage ?? 0),
    0
  );

  const undefinedData = 100 - totalShare;

  // Calculate total resource and DEC based on 100% share
  const totalResource =
    playerTradeHubPositions.reduce(
      (sum, p) => sum + (p.resource_quantity ?? 0),
      0
    ) /
    (totalShare / 100);

  const totalDEC =
    playerTradeHubPositions.reduce((sum, p) => sum + (p.dec_quantity ?? 0), 0) /
    (totalShare / 100);

  const sorted = [...playerTradeHubPositions].sort(
    (a, b) => (b.share_percentage ?? 0) - (a.share_percentage ?? 0)
  );

  const top10 = sorted.slice(0, 10);
  const rest = sorted.slice(10);

  const othersShare = rest.reduce(
    (sum, p) => sum + (p.share_percentage ?? 0),
    0
  );

  const labels: string[] = [];
  const values: number[] = [];

  top10.forEach((p) => {
    labels.push(p.player);
    values.push(p.share_percentage ?? 0);
  });

  if (othersShare > 0) {
    let others = othersShare + undefinedData;

    // Add the current player to labels and values if it exists
    if (
      currentPlayerData &&
      !labels.find((p) => p == currentPlayerData.player)
    ) {
      others = others - currentPlayerData.share_percentage;
      labels.push(currentPlayerData.player);
      values.push(currentPlayerData.share_percentage ?? 0);
    }

    labels.push("Others");
    values.push(others);
  }

  return (
    <Box
      width="100%"
      height="100%"
      display="flex"
      flexDirection="column"
      mt={2}
    >
      <Box
        display={"flex"}
        justifyContent={"center"}
        alignItems={"center"}
        width={"100%"}
      >
        <PoolIcon
          resource={playerTradeHubPositions[0]?.token.split("-")[1]}
          width={75}
          height={75}
        />
      </Box>

      <Box pl={3} pr={3}>
        <InfoItem
          title={"Total Shares:"}
          text={`${totalShare.toFixed(2)}%`}
          fontSize={18}
        />
        <InfoItem
          title={`Total ${playerTradeHubPositions[0]?.token.split("-")[1]}:`}
          text={formatNumberWithSuffix(totalResource)}
          fontSize={10}
        />
        <InfoItem
          title={"Total DEC:"}
          text={formatNumberWithSuffix(totalDEC)}
          fontSize={10}
        />

        {currentPlayerData && (
          <Box mb={2}>
            <InfoItem title={"Player:"} text={currentPlayerData.player} />
            <InfoItem
              title={"Share:"}
              text={`${currentPlayerData.share_percentage.toFixed(2)}%`}
            />
            <InfoItem
              title={"DEC Qty:"}
              text={formatNumberWithSuffix(currentPlayerData.dec_quantity)}
            />
            <InfoItem
              title={"Resource Qty:"}
              text={formatNumberWithSuffix(currentPlayerData.resource_quantity)}
            />
            <InfoItem
              title={"DEC Earned 1d:"}
              text={formatNumberWithSuffix(currentPlayerData.fees_earned_dec_1)}
            />
            <InfoItem
              title={"DEC Earned Total:"}
              text={formatNumberWithSuffix(
                currentPlayerData.total_fees_earned_dec
              )}
            />
            <InfoItem
              title={"Resources Earned 1d:"}
              text={formatNumberWithSuffix(
                currentPlayerData.fees_earned_resource_1
              )}
            />
            <InfoItem
              title={"Resources Earned Total:"}
              text={formatNumberWithSuffix(
                currentPlayerData.total_fees_earned_resource
              )}
            />
          </Box>
        )}
      </Box>
      <FullscreenPlotWrapper
        data={[
          {
            title: { text: `${playerTradeHubPositions[0].token}` },
            type: "pie",
            labels,
            values,
            textinfo: "label+percent",
            textposition: "inside", // only show text inside slices

            hoverinfo: "label+value+percent",
            hole: 0.3,
            pull: labels.map((label) =>
              label === currentPlayerData?.player ? 0.15 : 0
            ),
          },
        ]}
        layout={{
          margin: { t: 0, b: 0, l: 0, r: 0 },
          showlegend: false,
        }}
      />
    </Box>
  );
}
