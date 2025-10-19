"use client";

import { FullscreenPlotWrapper } from "@/components/ui/graph/FullscreenPlotWrapper";
import { Resource } from "@/constants/resource/resource";
import {
  DEFAULT_ORDER_RESOURCES,
  RESOURCE_COLOR_MAP,
} from "@/lib/shared/statics";
import { Box } from "@mui/material";
import { PlotData } from "plotly.js";

type Props = {
  rewardsPerHour: Record<Resource, number>;
};

export default function ResourceRewardChart({ rewardsPerHour }: Props) {
  // Filter out Unknown Resource
  const resourceLabels = Object.keys(rewardsPerHour)
    .filter((r) => r !== "" && r !== "TAX")
    .sort((a, b) => {
      const indexA = DEFAULT_ORDER_RESOURCES.indexOf(a as Resource);
      const indexB = DEFAULT_ORDER_RESOURCES.indexOf(b as Resource);
      return indexA - indexB;
    }) as Resource[];

  const rawTraces: Partial<PlotData>[] = resourceLabels.map((resourceLabel) => {
    const rawPP = rewardsPerHour[resourceLabel];
    const color = RESOURCE_COLOR_MAP[resourceLabel] || "black";
    return {
      x: [resourceLabel],
      y: [rawPP],
      name: resourceLabel,
      type: "bar",
      marker: { color },
    };
  });

  return (
    <>
      <Box
        sx={{
          width: "100%",
          height: 500,
        }}
      >
        <FullscreenPlotWrapper
          data={[...rawTraces]}
          layout={{
            title: { text: "Resource Rewards per Hour" },
            barmode: "group",
            xaxis: {
              title: { text: "Resources" },
              showgrid: false,
            },
            yaxis: {
              title: { text: "Rewards per Hour" },
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
