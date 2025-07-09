import { resourceTracking } from "@/generated/prisma";
import { RESOURCE_COLOR_MAP } from "@/lib/shared/statics";
import { Box, useTheme } from "@mui/material";
import { ScatterData } from "plotly.js";
import React from "react";
import { FullscreenPlotWrapper } from "@/components/ui/graph/FullscreenPlotWrapper";

interface Props {
  data: resourceTracking[];
}

const ResourcePPLineChart: React.FC<Props> = ({ data }) => {
  const theme = useTheme();
  const backgroundColor = theme.palette.background.default;
  const textColor = theme.palette.text.primary;

  // Group data by resource token_symbol
  const grouped = data.reduce<Record<string, resourceTracking[]>>(
    (acc, entry) => {
      (acc[entry.token_symbol] ||= []).push(entry);
      return acc;
    },
    {},
  );

  const traces: Partial<ScatterData>[] = Object.entries(grouped).map(
    ([resource, entries]) => ({
      x: entries.map((e) => e.date),
      y: entries.map((e) => e.total_harvest_pp),
      name: resource,
      mode: "lines+markers",
      line: {
        color: RESOURCE_COLOR_MAP[resource] || "#ccc",
      },
      type: "scatter",
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
      <FullscreenPlotWrapper
        data={traces}
        layout={{
          title: { text: "Historical Boosted PP Chart" },
          xaxis: { title: { text: "Date" } },
          font: { color: textColor },
          yaxis: {
            title: { text: "Boosted PP" },
            type: "log",
            autorange: true,
          },
          legend: { orientation: "h", y: -0.2 },
          paper_bgcolor: backgroundColor,
          plot_bgcolor: backgroundColor,
        }}
        config={{ responsive: true }}
      />
    </Box>
  );
};

export default ResourcePPLineChart;
