"use client";

import { RankedItemBox } from "@/components/region-overview/RankedItemBox";
import { ResourceLeaderboard } from "@/lib/backend/actions/production-leaderboard-actions";
import { formatLargeNumber } from "@/lib/formatters";
import { RESOURCE_ICON_MAP, TAX_RATE } from "@/lib/shared/statics";
import { Box, Card, Typography } from "@mui/material";
import Image from "next/image";
import { FullscreenPlotWrapper } from "../ui/graph/FullscreenPlotWrapper";

type Props = {
  leaderboard: ResourceLeaderboard;
  currentPlayer?: string;
};

export default function ProductionLeaderboardColumn({
  leaderboard,
  currentPlayer,
}: Props) {
  const { resource, top, playerInfo } = leaderboard;

  // Determine if player should be added (not in top x)
  const playerNotInTop50 =
    currentPlayer && playerInfo && !top.some((p) => p.player === currentPlayer);

  // Build chart data - add player if not in top x
  const chartData = playerNotInTop50 ? [...top, playerInfo!] : top;

  const players = chartData.map((p) => p.player);
  const productions = chartData.map((p) => p.production);

  // Highlight current player
  const colors = chartData.map((p) =>
    p.player === currentPlayer ? "#ef4444" : "#94a3b8"
  );

  const rank = playerInfo
    ? `Rank: ${playerInfo?.rank} / ${playerInfo?.total}`
    : "Rank: N/A";

  const production = playerInfo?.production;

  const playerProduction = production
    ? `Production: ${production.toFixed(3)} / hr`
    : "Production: N/A";
  const playerProductionIncTax = production
    ? `Production: ${(production - production * TAX_RATE).toFixed(3)} / hr`
    : "Production: N/A";

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
              y: productions,
              marker: { color: colors },
              hovertemplate: "%{x}<br>%{y:.2f}/hr<extra></extra>",
            },
          ]}
          layout={{
            title: { text: `${resource} Production` },
            xaxis: {
              showgrid: false,
              tickangle: -45,
              tickfont: { size: 8 },
            },
            yaxis: {
              title: { text: "Production /hr (log)" },
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
                <Typography variant="body2">{playerProduction}</Typography>
                <Box display="flex" gap={1}>
                  <Typography variant="body2">
                    {playerProductionIncTax}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="gray"
                    fontSize="0.625rem"
                    sx={{ mt: 0.25 }}
                  >
                    {"(incl. tax)"}
                  </Typography>
                </Box>
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
          </Box>

          {chartData.map((p, index) => (
            <RankedItemBox
              key={`ranked-box-${resource}-${p.player}-${index}`}
              rank={p.rank}
              value={formatLargeNumber(p.production)}
              subValue={p.player}
              highlight={p.player === currentPlayer}
            />
          ))}
        </Card>
      </Box>
    </Box>
  );
}
