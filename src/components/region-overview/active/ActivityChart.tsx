import { FullscreenPlotWrapper } from "@/components/ui/graph/FullscreenPlotWrapper";
import { Active } from "@/generated/prisma";
import { Box, Typography } from "@mui/material";
import { useEffect, useState } from "react";

export default function ActivityChart() {
  const [data, setData] = useState<Active[]>([]);

  useEffect(() => {
    fetch("/api/active", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => res.json())
      .then((raw) => {
        setData(raw);
      })
      .catch(console.error);
  }, []);

  const dates = data.map((row) => row.date);
  const activeBasedOnPP = data.map((row) => row.active_based_on_pp);
  const activeBasedOnInUse = data.map((row) => row.active_based_on_in_use);
  const percentage = data.map(
    (row) => (row.active_based_on_pp / 150_000) * 100,
  );

  return (
    <>
      <Typography mt={4} variant="h4">
        Historical activation of land
      </Typography>

      <Box
        sx={{
          width: "100%",
          height: 500,
        }}
      >
        <FullscreenPlotWrapper
          data={[
            {
              x: dates,
              y: activeBasedOnPP,
              type: "scatter",
              mode: "lines+markers",
              name: "Active (based on PP)",
              line: { color: "steelblue" },
              marker: { color: "steelblue", size: 6 },
            },
            {
              x: dates,
              y: activeBasedOnInUse,
              mode: "lines+markers",
              name: "Active (based on in use)",
              marker: { color: "#94a3b8" },
            },
            {
              x: dates,
              y: percentage,
              type: "scatter",
              mode: "lines",
              name: "Percentage",
              line: { color: "hotpink", width: 2, dash: "dash" },
              yaxis: "y2",
              hovertemplate: "%{y:.2f}%<extra></extra>",
            },
          ]}
          layout={{
            title: { text: "Activity Historical" },
            margin: { b: 100, l: 50, r: 60, t: 50 },
            xaxis: {
              title: { text: "Date" },
              showgrid: false,
            },
            yaxis: {
              title: { text: "Deeds" },
            },
            yaxis2: {
              title: { text: "Percentage (%)", font: { color: "hotpink" } },
              overlaying: "y",
              side: "right",
              showgrid: false,
              tickfont: { color: "hotpink" },
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
