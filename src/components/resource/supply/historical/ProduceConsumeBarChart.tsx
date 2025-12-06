import { FullscreenPlotWrapper } from "@/components/ui/graph/FullscreenPlotWrapper";
import { RESOURCE_COLOR_MAP } from "@/lib/shared/statics";
import { ResourceSupplyOverview } from "@/types/resourceSupplyOverview";
import { Box } from "@mui/material";
import { PlotData } from "plotly.js";
import React from "react";

interface Props {
  data: ResourceSupplyOverview[];
}

const ProduceConsumeBarChart: React.FC<Props> = ({ data }) => {
  const resourceMap: Record<string, { x: string[]; y: number[] }> = {};

  data.forEach((entry) => {
    const date = entry.date;
    for (const [resource, values] of Object.entries(entry.resource)) {
      if (!resourceMap[resource]) {
        resourceMap[resource] = { x: [], y: [] };
      }
      const value = values["daily_production"] - values["daily_consume"];
      resourceMap[resource].x.push(date);
      resourceMap[resource].y.push(value);
    }
  });

  const traces: Partial<PlotData>[] = Object.entries(resourceMap).map(
    ([resource, val]) => ({
      x: val.x,
      y: val.y,
      type: "bar",
      name: resource,
      marker: { color: RESOURCE_COLOR_MAP[resource] || "black" },
      barmode: "group",
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
          title: {
            text: "Net Daily Production (Produce - Consume)",
          },
          legend: {
            font: {
              size: 10,
            },
            orientation: "v",
          },
          xaxis: {
            title: { text: "Date" },
            showgrid: false,
            // type: "category",
          },
          yaxis: {
            title: { text: "Net Production" },
          },
        }}
      />
    </Box>
  );
};

export default ProduceConsumeBarChart;
