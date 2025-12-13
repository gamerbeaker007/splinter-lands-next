"use client";

import { FullscreenPlotWrapper } from "@/components/ui/graph/FullscreenPlotWrapper";
import { ProductionPoints } from "@/types/productionPoints";
import { Box } from "@mui/material";

type Props = {
  title: string;
  totalPP: ProductionPoints;
};

export default function BaseVsBoostedPPChart({ title, totalPP }: Props) {
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
              x: ["BASE"],
              y: [totalPP.basePP],
              name: "Base PP",
              type: "bar",
              marker: { color: "steelblue" },
            },
            {
              x: ["BOOSTED"],
              y: [totalPP.boostedPP],
              name: "Boosted PP",
              type: "bar",
              marker: { color: "#94a3b8" }, // light blue
            },
          ]}
          layout={{
            title: { text: title },
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
