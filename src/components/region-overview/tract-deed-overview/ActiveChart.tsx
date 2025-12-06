"use client";

import { FullscreenPlotWrapper } from "@/components/ui/graph/FullscreenPlotWrapper";
import { Box } from "@mui/material";

type Props = {
  playersActive: Record<string, { active: number; inactive: number }>;
};

export default function ActiveChart({ playersActive }: Props) {
  // Sort players by total (active + inactive) in descending order
  const sortedPlayers = Object.entries(playersActive).sort(
    ([, a], [, b]) => b.active + b.inactive - (a.active + a.inactive)
  );

  const playerNames = sortedPlayers.map(([name]) => name);
  const activeValues = sortedPlayers.map(([, data]) => data.active);
  const inactiveValues = sortedPlayers.map(([, data]) => data.inactive);

  return (
    <>
      <Box
        sx={{
          width: "100%",
          height: 500,
        }}
      >
        <FullscreenPlotWrapper
          data={[
            {
              x: playerNames,
              y: activeValues,
              name: "Active",
              type: "bar",
              marker: { color: "steelblue" },
            },
            {
              x: playerNames,
              y: inactiveValues,
              name: "Inactive",
              type: "bar",
              marker: { color: "#94a3b8" },
            },
          ]}
          layout={{
            title: { text: "Player Activity" },
            barmode: "stack",
            xaxis: {
              title: { text: "Players" },
              showgrid: false,
            },
            yaxis: {
              title: { text: "Count" },
            },
            legend: {
              orientation: "h",
              y: -0.3,
            },
          }}
        />
      </Box>
    </>
  );
}
