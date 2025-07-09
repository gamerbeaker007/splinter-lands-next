"use client";

import { Box, useTheme } from "@mui/material";
import { RegionResourcePP } from "@/types/regionProductionSummary";
import { RESOURCE_COLOR_MAP } from "@/lib/shared/statics";
import { PlotData } from "plotly.js";
import { FullscreenPlotWrapper } from "@/components/ui/graph/FullscreenPlotWrapper";

type Props = {
  data: Record<string, RegionResourcePP>;
};

export default function ResourcePPChart({ data }: Props) {
  const theme = useTheme();
  const textColor = theme.palette.text.primary;
  const backgroundColor = theme.palette.background.default;

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
        mt={1}
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
            height: 500,
            margin: { b: 100 },
            font: { color: textColor },
            xaxis: {
              title: { text: "Resources" },
              tickfont: { size: 10 },
            },
            yaxis: {
              title: { text: "Production Points" },
            },
            plot_bgcolor: backgroundColor,
            paper_bgcolor: backgroundColor,
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
