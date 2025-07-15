import { FullscreenPlotWrapper } from "@/components/ui/graph/FullscreenPlotWrapper";
import { resourceTracking } from "@/generated/prisma";
import { RESOURCE_COLOR_MAP } from "@/lib/shared/statics";
import { Box } from "@mui/material";
import { ScatterData } from "plotly.js";
import React from "react";

interface Props {
  data: resourceTracking[];
}

const ResourcePPLineChart: React.FC<Props> = ({ data }) => {
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
        width: "100%",
        height: 500,
      }}
    >
      <FullscreenPlotWrapper
        data={traces}
        layout={{
          title: { text: "Historical Boosted PP Chart" },
          xaxis: { title: { text: "Date" }, showgrid: false },
          yaxis: {
            title: { text: "Boosted PP (log)" },
            type: "log",
            autorange: true,
          },
          legend: { orientation: "h", y: -0.3 },
        }}
        config={{ responsive: true }}
      />
    </Box>
  );
};

export default ResourcePPLineChart;
