"use client";
import { ResourceHubMetrics } from "@/generated/prisma";
import { RESOURCE_COLOR_MAP } from "@/scripts/lib/utils/statics";
import { Box, useTheme } from "@mui/material";
import React from "react";
import Plot from "react-plotly.js";
import { Layout, ScatterData } from "plotly.js";

interface Props {
  data: ResourceHubMetrics[];
}

export const ResourceFactorChart: React.FC<Props> = ({ data }) => {
  const theme = useTheme();
  const backgroundColor = theme.palette.background.default;
  const textColor = theme.palette.text.primary;

  const filteredData = data
    .filter((d) => ["WOOD", "STONE", "IRON"].includes(d.token_symbol))
    .map((d) => ({
      ...d,
      factor: parseFloat(d.factor.toFixed(2)),
      grain_equivalent: parseFloat(d.grain_equivalent.toFixed(3)),
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
        line: { color: RESOURCE_COLOR_MAP[symbol] },
        marker: { size: 6 },
        hovertemplate: `<b>%{x}</b><br>${symbol} factor: %{y}<extra></extra>`,
      };
    },
  );

  const layout: Partial<Layout> = {
    title: { text: "Grain factor", font: { color: textColor } },
    height: 600,
    xaxis: { title: { text: "Date", font: { color: textColor } } },
    yaxis: {
      type: "linear",
      title: { text: "Factor", font: { color: textColor } },
    },
    // 🔁 Add secondary y-axis for dec_usd_value
    yaxis2: {
      title: { text: "DEC/USD (1000x)", font: { color: "purple" } },
      overlaying: "y",
      side: "right",
      showgrid: false,
      tickfont: { color: "purple" },
    },
    font: { color: textColor },
    paper_bgcolor: backgroundColor,
    plot_bgcolor: backgroundColor,
    legend: { orientation: "h", font: { color: textColor } },
    margin: { t: 50, l: 50, r: 50, b: 50 }, // widen right margin for y2
  };

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "secondary.main",
        borderRadius: 5,
        padding: 2,
        width: "100%",
        minHeight: "500px",
      }}
    >
      <Plot
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
            x: [filteredData[0]?.date, filteredData.at(-1)?.date],
            y: [1, 1],
            mode: "lines",
            line: { dash: "dash", color: "gray" },
            name: "1.00 (Grain baseline)",
            hoverinfo: "skip",
          } as Partial<ScatterData>,
        ]}
        layout={layout}
        useResizeHandler
        style={{ width: "100%" }}
        config={{ responsive: true }}
      />
    </Box>
  );
};
