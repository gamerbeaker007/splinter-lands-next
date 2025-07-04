"use client";

import { Box, useTheme } from "@mui/material";
import Plot from "react-plotly.js";
import { RegionPP } from "@/types/regionProductionSummary";

type Props = {
  data: RegionPP;
};

export default function RawVsBoostedPPChart({ data }: Props) {
  const theme = useTheme();
  const textColor = theme.palette.text.primary;
  const backgroundColor = theme.palette.background.default;

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
        <Plot
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
            height: 500,
            margin: { b: 100 },
            font: { color: textColor },
            xaxis: {
              title: { text: "Regions" },
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
          style={{ width: "100%", height: "500px" }}
          useResizeHandler
        />
      </Box>
    </>
  );
}
