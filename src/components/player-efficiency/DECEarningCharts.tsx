"use client";

import { FullscreenPlotWrapper } from "@/components/ui/graph/FullscreenPlotWrapper";
import { PRODUCING_RESOURCES, RESOURCE_COLOR_MAP } from "@/lib/shared/statics";
import { PlayerProductionSummaryEnriched } from "@/types/PlayerProductionSummaryEnriched";
import { Box } from "@mui/material";

type Props = {
  data: PlayerProductionSummaryEnriched[];
  currentPlayer?: string;
};

export default function DECEarningCharts({ data, currentPlayer }: Props) {
  const sorted = [...data]
    .filter((d) => d.total_dec !== undefined)
    .sort((a, b) => (b.total_dec ?? 0) - (a.total_dec ?? 0));

  const players = sorted.map((d) => d.player);

  const traces: Partial<Plotly.PlotData>[] = [];

  for (const res of PRODUCING_RESOURCES) {
    const col = `dec_${res.toLowerCase()}`;
    const positive: number[] = [];
    const negative: number[] = [];

    for (const d of sorted) {
      const val = d[col as keyof PlayerProductionSummaryEnriched] as
        | number
        | undefined;
      positive.push(val && val > 0 ? val : 0);
      negative.push(val && val < 0 ? val : 0);
    }

    traces.push({
      type: "bar",
      x: players,
      y: positive,
      name: col,
      legendgroup: col,
      marker: { color: RESOURCE_COLOR_MAP[res] },
      showlegend: true,
    });

    traces.push({
      type: "bar",
      x: players,
      y: negative,
      name: col,
      legendgroup: col,
      marker: { color: RESOURCE_COLOR_MAP[res] },
      showlegend: false,
    });
  }

  return (
    <Box display={"flex"} flexWrap={"wrap"} gap={2}>
      <Box
        sx={{
          width: "100%",
          height: 500,
        }}
      >
        <FullscreenPlotWrapper
          data={traces}
          layout={{
            barmode: "relative",
            title: {
              text: "Hourly Earning From Land Resources (converted to DEC)",
            },
            xaxis: {
              title: { text: "Player" },
              tickangle: -45,
              automargin: true,
              showgrid: false,
            },
            yaxis: {
              title: { text: "Hourly DEC" },
            },
            shapes: getCurrentPlayerShape(players, currentPlayer),
          }}
        />
      </Box>
      <Box
        sx={{
          width: "100%",
          height: 500,
        }}
      >
        <FullscreenPlotWrapper
          data={[
            {
              type: "bar",
              x: players,
              y: sorted.map((d) => d.total_dec ?? 0),
              name: "Total DEC",
              hoverinfo: "x+y",
            },
          ]}
          layout={{
            barmode: "relative",
            title: { text: "Total DEC earning)" },
            xaxis: {
              title: { text: "Player" },
              tickangle: -45,
              automargin: true,
              showgrid: false,
            },
            yaxis: {
              title: { text: "Hourly DEC" },
            },
            shapes: getCurrentPlayerShape(players, currentPlayer),
          }}
        />
      </Box>
    </Box>
  );
}

const getCurrentPlayerShape = (
  players: string[],
  currentPlayer?: string,
): Partial<Plotly.Shape>[] => {
  if (!currentPlayer) return [];

  const index = players.indexOf(currentPlayer);
  if (index === -1) return [];

  return [
    {
      type: "line",
      x0: currentPlayer,
      x1: currentPlayer,
      yref: "paper",
      y0: 0,
      y1: 1,
      line: {
        color: "red",
        width: 2,
        dash: "dashdot",
      },
    },
  ];
};
