"use client";

import { PlayerProductionSummaryEnriched } from "@/types/PlayerProductionSummaryEnriched";
import { Box } from "@mui/material";
import { ScatterData, Shape } from "plotly.js";
import React from "react";
import { FullscreenPlotWrapper } from "../ui/graph/FullscreenPlotWrapper";

export interface RatioRankPlotProps {
  data?: PlayerProductionSummaryEnriched[] | null;
  currentPlayer?: string;
  xColumn: keyof PlayerProductionSummaryEnriched;
  yColumn: keyof PlayerProductionSummaryEnriched;
  hoverLabel?: string;
  title?: string;
  xAxisTitle?: string;
  yAxisTitle?: string;
}

const RatioRankPlot: React.FC<RatioRankPlotProps> = ({
  data,
  currentPlayer,
  xColumn,
  yColumn,
  hoverLabel = "Ratio",
  title = "Ratio vs Rank (Bubble = Base PP)",
  xAxisTitle = "Ratio",
  yAxisTitle = "Rank",
}) => {
  if (!data || data.length === 0) return null;

  const df = data.filter((row) => {
    const x = row[xColumn];
    const y = row[yColumn];
    return (
      typeof x === "number" &&
      typeof y === "number" &&
      isFinite(x) &&
      isFinite(y)
    );
  });

  const highlightEnabled =
    currentPlayer && df.some((row) => row.player === currentPlayer);

  const sizeColumn = df.map((row) => row.total_base_pp_after_cap / 1_000_000);
  const maxSize = Math.max(...sizeColumn);
  const sizerefVal = (2 * maxSize) / 100 ** 2;

  const xValues = df.map((row) => row[xColumn] as number);
  const yValues = df.map((row) => row[yColumn] as number);
  const players = df.map((row) => row.player);
  const customData = df.map((row) => [row.total_base_pp_after_cap]);

  const fillColors = df.map((row) =>
    highlightEnabled
      ? row.player === currentPlayer
        ? "red"
        : "rgba(0,0,0,0)"
      : "steelblue",
  );
  const borderColors = df.map((row) =>
    highlightEnabled && row.player === currentPlayer ? "red" : "white",
  );

  const shapes: Partial<Shape>[] = [];
  if (highlightEnabled) {
    const playerRow = df.find((row) => row.player === currentPlayer)!;
    const xVal = playerRow[xColumn] as number;
    const yVal = playerRow[yColumn] as number;
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);

    shapes.push(
      {
        type: "line",
        x0: xVal,
        x1: xVal,
        y0: yMin,
        y1: yMax,
        line: { color: "red", width: 2, dash: "dash" },
      },
      {
        type: "line",
        x0: xMin,
        x1: xMax,
        y0: yVal,
        y1: yVal,
        line: { color: "red", width: 2, dash: "dash" },
      },
    );
  }

  const traces: Partial<ScatterData>[] = [
    {
      x: xValues,
      y: yValues,
      text: players,
      customdata: customData,
      mode: "markers",
      type: "scatter",
      marker: {
        size: sizeColumn,
        sizemode: "area",
        sizeref: sizerefVal,
        sizemin: 4,
        color: fillColors,
        line: { width: 2, color: borderColors },
      },
      hovertemplate:
        `<b>%{text}</b><br>${hoverLabel}: %{x:.2f}` +
        `<br>Value: %{y}<br>Base PP: %{customdata[0]:,.0f}<extra></extra>`,
      name: "Players",
    },
    ...[1_000_000, 5_000_000, 10_000_000].map((value) => ({
      x: [null],
      y: [null],
      mode: "markers" as const,
      type: "scatter" as const,
      marker: {
        size: value / 100_000,
        color: "lightgray",
        line: { width: 2, color: "white" },
        sizemode: "area",
        sizeref: sizerefVal,
      },
      name: `${value / 1_000_000}M PP`,
      showlegend: true,
    })),
  ];

  return (
    <Box
      mt={1}
      sx={{
        width: "100%",
        height: 500,
      }}
    >
      <FullscreenPlotWrapper
        data={traces}
        layout={{
          title: { text: title },
          xaxis: { title: { text: xAxisTitle } },
          yaxis: { title: { text: yAxisTitle } },
          shapes,
          legend: { orientation: "h" },
          margin: { t: 50 },
        }}
      />
    </Box>
  );
};

export default RatioRankPlot;
