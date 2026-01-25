"use client";

import { RankedItemBox } from "@/components/region-overview/RankedItemBox";
import { ResourceLeaderboard } from "@/lib/backend/actions/production-leaderboard-actions";
import { formatLargeNumber } from "@/lib/formatters";
import { RESOURCE_ICON_MAP } from "@/lib/shared/statics";
import { Box, Card, Divider, Typography } from "@mui/material";
import Image from "next/image";
import { FullscreenPlotWrapper } from "../ui/graph/FullscreenPlotWrapper";

type Props = {
  leaderboard: ResourceLeaderboard;
  currentPlayer?: string;
  showNet: boolean;
};

export default function ProductionLeaderboardColumn({
  leaderboard,
  currentPlayer,
  showNet,
}: Props) {
  const { resource, top, topNet, playerInfo } = leaderboard;

  // Use either top or topNet based on toggle
  const topRankingList = showNet ? topNet : top;

  // Determine if player should be added (not in top x)
  const playerNotInTop =
    currentPlayer &&
    playerInfo &&
    !topRankingList.some((p) => p.player === currentPlayer);

  // Build chart data - add player if not in top x
  const chartData = playerNotInTop
    ? [...topRankingList, playerInfo!]
    : topRankingList;
  const players = chartData.map((p) => p.player);
  const values = chartData.map((p) =>
    showNet ? p.netProduction : p.production
  );

  // Highlight current player
  const colors = chartData.map((p) =>
    p.player === currentPlayer ? "#ef4444" : "#94a3b8"
  );

  const rank = playerInfo
    ? showNet
      ? `Net Rank: ${playerInfo.netRank} / ${playerInfo.total}`
      : `Rank: ${playerInfo.rank} / ${playerInfo.total}`
    : "Rank: N/A";

  const production = playerInfo?.production;
  const consumed = playerInfo?.consumed;
  const netProduction = playerInfo?.netProduction;

  const playerProduction = production
    ? `Production: ${production.toFixed(3)} / hr`
    : "Production: 0 / hr";

  const playerConsumed =
    consumed !== undefined
      ? `Consumed: ${consumed.toFixed(3)} / hr`
      : "Consumed: 0 / hr";
  const playerNet =
    netProduction !== undefined
      ? `Net: ${netProduction.toFixed(3)} / hr`
      : "Net: 0 / hr";

  const playerPercentageOfTotal =
    production && leaderboard.total
      ? ((production / leaderboard.total) * 100).toFixed(2)
      : "0";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        minWidth: 300,
        maxWidth: 300,
        flex: 1,
      }}
    >
      {/* Resource Icon */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: 1,
        }}
      >
        <Image
          src={RESOURCE_ICON_MAP[resource]}
          alt={resource}
          width={60}
          height={60}
        />
      </Box>

      {/* Bar Chart */}
      <Box
        sx={{
          width: "100%",
          height: 400,
        }}
      >
        <FullscreenPlotWrapper
          data={[
            {
              type: "bar",
              x: players,
              y: values,
              marker: { color: colors },
              hovertemplate: "%{x}<br>%{y:.2f}/hr<extra></extra>",
            },
          ]}
          layout={{
            title: {
              text: `${resource} ${showNet ? "Net Production" : "Production"}`,
            },
            xaxis: {
              showgrid: false,
              tickangle: -45,
              tickfont: { size: 8 },
            },
            yaxis: {
              title: { text: `${showNet ? "Net " : ""}Production /hr (log)` },
              showgrid: true,
              type: "log",
            },
            margin: { l: 50, r: 20, t: 50, b: 100 },
            showlegend: false,
          }}
        />
      </Box>

      {/* Ranking List */}
      <Box minWidth={300}>
        <Card sx={{ maxHeight: 500, overflowY: "auto" }}>
          {/* Player Info */}
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
            {playerInfo && (
              <Box
                component="fieldset"
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  px: 1,
                  py: 1,
                  m: 0,
                }}
              >
                <Box
                  component="legend"
                  sx={{
                    px: 1,
                    color: "text.secondary",
                    fontSize: "0.875rem",
                  }}
                >
                  {currentPlayer}
                </Box>
                <Typography variant="h6" color="secondary.main">
                  {rank}
                </Typography>
                <Box display="flex" gap={1}>
                  <Typography variant="body2">{playerProduction}</Typography>
                  <Typography
                    variant="caption"
                    color="gray"
                    fontSize="0.625rem"
                    sx={{ mt: 0.25 }}
                  >
                    {"(incl. tax)"}
                  </Typography>
                </Box>
                <Typography variant="body2">{`Share: ${playerPercentageOfTotal}%`}</Typography>
                <Divider />
                <Typography variant="body2">{playerConsumed}</Typography>
                <Typography
                  variant="body2"
                  fontWeight="bold"
                  color={
                    netProduction === undefined || netProduction === 0
                      ? "gray"
                      : netProduction > 0
                        ? "success.main"
                        : "error.main"
                  }
                >
                  {playerNet}
                </Typography>
              </Box>
            )}

            <Typography
              variant="body1"
              color="primary.main"
              fontWeight="bold"
              fontSize={20}
            >
              Total: {formatLargeNumber(leaderboard.total)}
            </Typography>
            <Typography
              variant="body1"
              color="primary.main"
              fontWeight="bold"
              fontSize={20}
            >
              Total Net: {formatLargeNumber(leaderboard.totalNet ?? 0)}
            </Typography>
            {leaderboard.totalConsumed !== undefined && (
              <Typography variant="body2" color="text.secondary">
                Total Consumed: {formatLargeNumber(leaderboard.totalConsumed)}
              </Typography>
            )}
          </Box>

          {chartData.map((p, index) => (
            <RankedItemBox
              key={`ranked-box-${resource}-${p.player}-${index}`}
              rank={showNet ? p.netRank : p.rank}
              value={formatLargeNumber(
                showNet ? p.netProduction : p.production
              )}
              subValue={p.player}
              highlight={p.player === currentPlayer}
            />
          ))}
        </Card>
      </Box>
    </Box>
  );
}
