"use client";

import { FullscreenPlotWrapper } from "@/components/ui/graph/FullscreenPlotWrapper";
import { RESOURCE_COLOR_MAP } from "@/lib/shared/statics";
import { RegionResourcePP } from "@/types/regionProductionSummary";
import { Box } from "@mui/material";
import { PlotData } from "plotly.js";

type Props = {
  data: Record<string, RegionResourcePP>;
};

export default function ResourcePPChart({ data }: Props) {
  // Filter out Unknown Resource
  const resourceLabels = Object.keys(data).filter((r) => r !== "");
  const rawTraces: Partial<PlotData>[] = resourceLabels.map(
    (resourceLabel, i) => {
      const rawPP = data[Object.keys(data)[i]].totalPP.rawPP;
      const color = RESOURCE_COLOR_MAP[resourceLabel] || "black";
      return {
        x: [resourceLabel],
        y: [rawPP],
        name: resourceLabel,
        type: "bar",
        marker: { color },
      };
    },
  );

  const boostedValues = resourceLabels.map(
    (r, i) => data[Object.keys(data)[i]].totalPP.boostedPP,
  );

  return (
    <>
      <Box
        sx={{
          width: "100%",
          height: 500,
        }}
      >
        <FullscreenPlotWrapper
          data={[
            ...rawTraces,
            {
              x: resourceLabels,
              y: boostedValues,
              name: "Boosted PP",
              type: "scatter",
              mode: "lines+markers",
              marker: { color: "#94a3b8" },
              line: { width: 2 },
            },
          ]}
          layout={{
            title: { text: "Resource Raw vs Boosted PP" },
            barmode: "group",
            xaxis: {
              title: { text: "Resources" },
              showgrid: false,
            },
            yaxis: {
              title: { text: "Production Points" },
            },
            legend: {
              orientation: "h",
              y: -0.3,
            },
          }}
        />
      </Box>
    </>
  );
}
