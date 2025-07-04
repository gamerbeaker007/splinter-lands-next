import { ResourceHubMetrics } from "@/generated/prisma";
import { RESOURCE_COLOR_MAP } from "@/lib/shared/statics";
import { Box, useTheme } from "@mui/material";
import { ScatterData } from "plotly.js";
import React from "react";
import Plot from "react-plotly.js";

interface Props {
  data: ResourceHubMetrics[];
  type: "dec_volume_1" | "dec_burned"; // updated types
}

const getChartTitle = (type: Props["type"]): string => {
  switch (type) {
    case "dec_volume_1":
      return "24h DEC Volume";
    case "dec_burned":
      return "24h DEC Burned (5%)";
    default:
      return "Chart";
  }
};

const TradeHubLineChart: React.FC<Props> = ({ data, type }) => {
  const theme = useTheme();
  const backgroundColor = theme.palette.background.default;
  const textColor = theme.palette.text.primary;
  const gridLineColor = theme.palette.divider;
  const burnRate = 0.05;

  const resourceMap: Record<string, { x: string[]; y: number[] }> = {};

  data.forEach((entry) => {
    const date = new Date(entry.date).toISOString().split("T")[0];
    const resource = entry.token_symbol;
    const raw = Number(entry.dec_volume_1);

    if (!resourceMap[resource]) {
      resourceMap[resource] = { x: [], y: [] };
    }

    const yValue = type === "dec_burned" ? raw * burnRate : raw;

    resourceMap[resource].x.push(date);
    resourceMap[resource].y.push(yValue);
  });

  const traces: Partial<ScatterData>[] = Object.entries(resourceMap).map(
    ([resource, val]) => ({
      x: val.x,
      y: val.y,
      type: "scatter",
      mode: "lines+markers",
      name: resource,
      line: { color: RESOURCE_COLOR_MAP[resource] || "black" },
    }),
  );

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
        data={traces}
        layout={{
          title: { text: getChartTitle(type) },
          plot_bgcolor: backgroundColor,
          paper_bgcolor: backgroundColor,
          font: { color: textColor },
          legend: {
            font: {
              size: 10,
              color: textColor,
            },
            orientation: "v",
          },
          xaxis: { title: { text: "Date" }, showgrid: false },
          yaxis: {
            title: { text: "Amount" },
            gridcolor: gridLineColor,
            type: "linear",
          },
          margin: { t: 50, b: 40 },
        }}
        style={{ width: "100%", height: "500px" }}
        useResizeHandler
      />
    </Box>
  );
};

export default TradeHubLineChart;
