import { FullscreenPlotWrapper } from "@/components/ui/graph/FullscreenPlotWrapper";
import { ResourceHubMetrics } from "@/generated/prisma";
import { RESOURCE_COLOR_MAP } from "@/lib/shared/statics";
import { Box } from "@mui/material";
import { ScatterData } from "plotly.js";
import React from "react";

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
    })
  );

  return (
    <Box
      sx={{
        width: "100%",
        height: 500,
      }}
    >
      <FullscreenPlotWrapper
        data={traces}
        layout={{
          title: { text: getChartTitle(type) },
          legend: {
            font: {
              size: 10,
            },
            orientation: "v",
          },
          xaxis: { title: { text: "Date" }, showgrid: false },
          yaxis: {
            title: { text: "Amount" },
            type: "linear",
          },
        }}
      />
    </Box>
  );
};

export default TradeHubLineChart;
