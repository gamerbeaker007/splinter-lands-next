"use client";

import { FullscreenPlotWrapper } from "@/components/ui/graph/FullscreenPlotWrapper";
import { Resource } from "@/constants/resource/resource";
import {
  DEFAULT_ORDER_RESOURCES,
  RESOURCE_COLOR_MAP,
} from "@/lib/shared/statics";
import { ProductionPoints } from "@/types/productionPoints";
import { Box } from "@mui/material";
import { PlotData } from "plotly.js";

type Props = {
  production: Record<Resource, ProductionPoints>;
};

export default function ResourcePPChart({ production }: Props) {
  // Filter out Unknown Resource
  const resourceLabels = Object.keys(production)
    .filter((r) => r !== "")
    .sort((a, b) => {
      const indexA = DEFAULT_ORDER_RESOURCES.indexOf(a as Resource);
      const indexB = DEFAULT_ORDER_RESOURCES.indexOf(b as Resource);
      return indexA - indexB;
    }) as Resource[];

  const rawTraces: Partial<PlotData>[] = resourceLabels.map((resourceLabel) => {
    const rawPP = production[resourceLabel].basePP;
    const color = RESOURCE_COLOR_MAP[resourceLabel] || "black";
    return {
      x: [resourceLabel],
      y: [rawPP],
      name: resourceLabel,
      type: "bar",
      marker: { color },
    };
  });

  const boostedValues = resourceLabels.map(
    (resourceLabel) => production[resourceLabel].boostedPP
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
            title: { text: "Resource Base vs Boosted PP" },
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
