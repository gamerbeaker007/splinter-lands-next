import { RESOURCE_COLOR_MAP } from "@/scripts/lib/utils/statics";
import { ResourceSupplyOverview } from "@/types/resourceSupplyOverview";
import { Box, useTheme } from "@mui/material";
import React from "react";
import Plot from "react-plotly.js";

interface Props {
  data: ResourceSupplyOverview[];
}

const ProduceConsumeBarChart: React.FC<Props> = ({ data }) => {
  const theme = useTheme();
  const backgroundColor = theme.palette.background.default;
  const textColor = theme.palette.text.primary;
  const gridLineColor = theme.palette.divider;

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

  const traces: Partial<Plotly.Data>[] = Object.entries(resourceMap).map(
    ([resource, val]) => ({
      x: val.x,
      y: val.y,
      type: "bar",
      name: resource,
      marker: { color: RESOURCE_COLOR_MAP[resource] || "black" },
      barmode: "group",
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
          title: {
            text: "Net Daily Production (Produce - Consume)",
          },
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
          xaxis: {
            title: { text: "Date" },
            showgrid: false,
            // type: "category",
          },
          yaxis: {
            title: { text: "Net Production" },
            gridcolor: gridLineColor,
          },
          margin: { t: 50, b: 40 },
        }}
        style={{ width: "100%", height: "500px" }}
        useResizeHandler
      />
    </Box>
  );
};

export default ProduceConsumeBarChart;
