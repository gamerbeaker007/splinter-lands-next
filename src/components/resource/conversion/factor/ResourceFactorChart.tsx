"use client";
import { FullscreenPlotWrapper } from "@/components/ui/graph/FullscreenPlotWrapper";
import { ResourceHubMetrics } from "@/generated/prisma/client";
import { resourceChartColor } from "@/components/resource/resourceChartColor";
import { Box } from "@mui/material";
import { Layout, ScatterData } from "plotly.js";
import React from "react";

interface Props {
  data: ResourceHubMetrics[];
}

export const ResourceFactorChart: React.FC<Props> = ({ data }) => {
  const filteredData = data
    .filter(
      (d) =>
        ["WOOD", "STONE", "IRON"].includes(d.token_symbol) &&
        typeof d.factor === "number" &&
        Number.isFinite(d.factor)
    )
    .map((d) => ({
      ...d,
      factor: parseFloat(d.factor.toFixed(2)),
    }));

  const traces: Partial<ScatterData>[] = ["WOOD", "STONE", "IRON"].map(
    (symbol) => {
      const symbolData = filteredData.filter((d) => d.token_symbol === symbol);
      return {
        x: symbolData.map((d) => d.date),
        y: symbolData.map((d) => d.factor),
        mode: "lines+markers",
        type: "scatter",
        name: symbol,
        line: { color: resourceChartColor(symbol) },
        marker: { size: 6 },
        hovertemplate: `<b>%{x}</b><br>${symbol} factor: %{y}<extra></extra>`,
      };
    }
  );

  const layout: Partial<Layout> = {
    title: { text: "Grain factor" },
    xaxis: { title: { text: "Date" }, showgrid: false },
    yaxis: {
      type: "linear",
      title: { text: "Factor" },
    },
    // 🔁 Add secondary y-axis for dec_usd_value
    yaxis2: {
      title: { text: "DEC/USD (1000x)", font: { color: "purple" } },
      overlaying: "y",
      side: "right",
      showgrid: false,
      tickfont: { color: "purple" },
    },
    legend: { orientation: "h" },
  };

  return (
    <Box
      sx={{
        width: "100%",
        height: 600,
      }}
    >
      <FullscreenPlotWrapper
        data={[
          ...traces,
          {
            type: "scatter",
            x: data.map((d) => d.date),
            y: data.map((d) => d.dec_usd_value * 1000),
            mode: "lines",
            name: "DEC/USD",
            line: { color: "purple", width: 1, dash: "dash" },
            yaxis: "y2",
            hovertemplate: `<b>%{x}</b><br>DEC/USD: %{y}<extra></extra>`,
          } as Partial<ScatterData>,
          {
            type: "scatter",
            x: [data[0]?.date, data.at(-1)?.date],
            y: [1, 1],
            mode: "lines",
            line: { dash: "dash", color: "gray" },
            name: "1.00 (Grain baseline)",
            hoverinfo: "skip",
          } as Partial<ScatterData>,
        ]}
        layout={layout}
      />
    </Box>
  );
};
