"use client";

import { ResourceLeaderboard } from "@/lib/backend/actions/production-leaderboard-actions";
import { RESOURCE_ICON_MAP, TAX_RATE } from "@/lib/shared/statics";
import { Box, Typography } from "@mui/material";
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

      {/* Player Info */}

      <Box
        sx={{
          textAlign: "center",
          padding: 1,
          backgroundColor: "background.paper",
          borderRadius: 1,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {currentPlayer}
        </Typography>
        <Typography variant="h6" color="secondary.main">
          {rank}
        </Typography>
        <Box
          display="flex"
          flexDirection={"column"}
          width="fit-content"
          alignItems="flex-start"
          margin="0 auto"
        >
          <Typography variant="body2">{playerProduction}</Typography>
          <Box display="flex" gap={1}>
            <Typography variant="body2">{playerProductionIncTax}</Typography>
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
      </Box>

      {/* Bar Chart */}
      <Box
        sx={{
          width: "100%",
          height: 1000,
        }}
      >
        <FullscreenPlotWrapper
          data={[
            {
              type: "bar",
              y: players,
              x: productions,
              orientation: "h",
              marker: { color: colors },
              hovertemplate: "%{y}<br>%{x:.2f}/hr<extra></extra>",
            },
          ]}
          layout={{
            title: { text: resource },
            xaxis: {
              title: { text: "Production (per hour)" },
              showgrid: true,
            },
            yaxis: {
              autorange: "reversed",
              showgrid: false,
              tickfont: { size: 10 },
            },
            margin: { l: 100, r: 20, t: 50, b: 50 },
            showlegend: false,
          }}
        />
      </Box>
    </Box>
  );
}
