"use client";

import { FullscreenPlotWrapper } from "@/components/ui/graph/FullscreenPlotWrapper";
import { RegionPP } from "@/types/regionProductionSummary";
import { Box } from "@mui/material";

type Props = {
  data: RegionPP;
};

export default function RawVsBoostedPPChart({ data }: Props) {
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
            {
              x: ["RAW"],
              y: [data.totalPP.rawPP],
              name: "Raw PP",
              type: "bar",
              marker: { color: "steelblue" },
            },
            {
              x: ["BOOSTED"],
              y: [data.totalPP.boostedPP],
              name: "Boosted PP",
              type: "bar",
              marker: { color: "#94a3b8" }, // light blue
            },
          ]}
          layout={{
            title: { text: "Raw vs Boosted PP" },
            barmode: "group",
            xaxis: {
              title: { text: "Regions" },
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
