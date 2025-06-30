"use client";
import React from "react";
import Plot from "react-plotly.js";
import { Box, useTheme } from "@mui/material";
import { Layout, ScatterData } from "plotly.js";
import { ResourceHubMetrics } from "@/generated/prisma";
import { RESOURCE_COLOR_MAP } from "@/scripts/lib/utils/statics";

type Mode = "resource" | "dec"; // price = cost in DEC, dec = amount of resource
interface Props {
  data: ResourceHubMetrics[];
  mode: Mode;
  logY?: boolean;
}

export const ResourcePriceChart: React.FC<Props> = ({
  data,
  mode,
  logY = false,
}) => {
  const theme = useTheme();
  const backgroundColor = theme.palette.background.default;
  const textColor = theme.palette.text.primary;

  const transformedData = data.map((d) => ({
    ...d,
    display_value:
      mode === "resource" ? d.resource_price * 1000 : d.dec_price * 1000,
  }));

  const allSymbols = Array.from(
    new Set(transformedData.map((d) => d.token_symbol)),
  );

  const traces: Partial<ScatterData>[] = allSymbols.map((symbol) => {
    const tokenData = transformedData.filter((d) => d.token_symbol === symbol);
    return {
      x: tokenData.map((d) => d.date),
      y: tokenData.map((d) => d.display_value),
      mode: "lines+markers",
      type: "scatter",
      name: symbol,
      line: { color: RESOURCE_COLOR_MAP[symbol] ?? undefined },
      marker: { size: 6 },
      hovertemplate: `<b>%{x}</b><br>${symbol}: %{y:.2f}<extra></extra>`,
    };
  });

  const layout: Partial<Layout> = {
    title: { text: mode === "resource" ? "1000 Resources" : "1000 DEC" },
    height: 400,
    xaxis: { title: { text: "Date", font: { color: textColor } } },
    yaxis: {
      title: {
        text: mode === "resource" ? "Cost in DEC" : "Amount of Resource",
      },
      type: logY ? "log" : "linear",
      color: textColor,
    },
    font: { color: textColor },
    paper_bgcolor: backgroundColor,
    plot_bgcolor: backgroundColor,
    legend: {
      orientation: "h",
      font: { color: textColor },
      y: -0.35,
      yanchor: "bottom",
    },
    margin: { t: 50, l: 50, r: 20, b: 50 },
  };

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "secondary.main",
        borderRadius: 5,
        padding: 2,
        width: "100%",
      }}
    >
      <Plot
        data={traces}
        layout={layout}
        useResizeHandler
        style={{ width: "100%" }}
        config={{ responsive: true }}
      />
    </Box>
  );
};
