import { FullscreenPlotWrapper } from "@/components/ui/graph/FullscreenPlotWrapper";
import { RESOURCE_COLOR_MAP } from "@/lib/shared/statics";
import { ResourceSupplyOverview } from "@/types/resourceSupplyOverview";
import { Box } from "@mui/material";
import { ScatterData } from "plotly.js";
import React from "react";

interface Props {
  data: ResourceSupplyOverview[];
  type: "daily_production" | "daily_consume" | "total_supply";
}

const getChartTitle = (
  switchType: "daily_production" | "daily_consume" | "total_supply",
): string => {
  switch (switchType) {
    case "daily_production":
      return "Daily Production";
    case "daily_consume":
      return "Daily Consumption";
    case "total_supply":
      return "Daily Total Supply";
    default:
      return "Chart";
  }
};

const SupplyLineChart: React.FC<Props> = ({ data, type }) => {
  const resourceMap: Record<string, { x: string[]; y: number[] }> = {};

  data.forEach((entry) => {
    const date = entry.date;
    for (const [resource, values] of Object.entries(entry.resource)) {
      if (!resourceMap[resource]) {
        resourceMap[resource] = { x: [], y: [] };
      }
      const value =
        type === "total_supply"
          ? values["supply"] + values["trade_hub_supply"]
          : values[type];
      resourceMap[resource].x.push(date);
      resourceMap[resource].y.push(value);
    }
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
        width: "100%",
        height: 500,
      }}
    >
      <FullscreenPlotWrapper
        data={traces}
        layout={{
          title: {
            text: getChartTitle(type),
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
            // gridcolor: gridLineColor,
          },
          yaxis: {
            title: { text: "Amount" },
            type: "log",
          },
          margin: { b: 100, l: 50, r: 60, t: 50 },
        }}
      />
    </Box>
  );
};

export default SupplyLineChart;
