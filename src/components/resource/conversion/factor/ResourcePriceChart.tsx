"use client";
import { FullscreenPlotWrapper } from "@/components/ui/graph/FullscreenPlotWrapper";
import { ResourceHubMetrics } from "@/generated/prisma/client";
import { RESOURCE_COLOR_MAP } from "@/lib/shared/statics";
import { Box } from "@mui/material";
import { Layout, ScatterData } from "plotly.js";
import React from "react";

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
  const transformedData = data.map((d) => ({
    ...d,
    display_value:
      mode === "resource" ? d.resource_price * 1000 : d.dec_price * 1000,
  }));

  const allSymbols = Array.from(
    new Set(transformedData.map((d) => d.token_symbol))
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
    xaxis: { title: { text: "Date" }, showgrid: false },
    yaxis: {
      title: {
        text: mode === "resource" ? "Cost in DEC" : "Amount of Resource",
      },
      type: logY ? "log" : "linear",
    },
    legend: {
      orientation: "h",
      y: -0.35,
      yanchor: "bottom",
    },
  };

  return (
    <Box
      mb={2}
      sx={{
        width: "100%",
        height: 500,
      }}
    >
      <FullscreenPlotWrapper data={traces} layout={layout} />
    </Box>
  );
};
