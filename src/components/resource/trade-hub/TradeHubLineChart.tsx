import { FullscreenPlotWrapper } from "@/components/ui/graph/FullscreenPlotWrapper";
import { ResourceHubMetrics } from "@/generated/prisma/client";
import { RESOURCE_COLOR_MAP } from "@/lib/shared/statics";
import { Box } from "@mui/material";
import { ScatterData } from "plotly.js";
import React from "react";

interface Props {
  data: ResourceHubMetrics[];
}

const TradeHubLineChart: React.FC<Props> = ({ data }) => {
  const burnRate = 0.05;
  const resourceMap: Record<string, { x: string[]; y: number[] }> = {};

  data.forEach((entry) => {
    const date = new Date(entry.date).toISOString().split("T")[0];
    const resource = entry.token_symbol;
    const burned = Number(entry.dec_volume_1 ?? 0) * burnRate;

    if (!resourceMap[resource]) {
      resourceMap[resource] = { x: [], y: [] };
    }
    resourceMap[resource].x.push(date);
    resourceMap[resource].y.push(burned);
  });

  const traces: Partial<ScatterData>[] = Object.entries(resourceMap).map(
    ([resource, val]) => ({
      x: val.x,
      y: val.y,
      type: "scatter",
      mode: "lines+markers",
      name: resource,
      line: { color: RESOURCE_COLOR_MAP[resource] || "white" },
    })
  );

  return (
    <Box sx={{ width: "100%", height: 500 }}>
      <FullscreenPlotWrapper
        data={traces}
        layout={{
          title: { text: "24h DEC Burned (5%)" },
          legend: { font: { size: 10 }, orientation: "v" },
          xaxis: { title: { text: "Date" }, showgrid: false },
          yaxis: { title: { text: "DEC burned" }, type: "linear" },
        }}
      />
    </Box>
  );
};

export default TradeHubLineChart;
