import { Active } from "@/generated/prisma";
import { Typography, Box, useTheme } from "@mui/material";
import { useState, useEffect } from "react";
import Plot from "react-plotly.js";

export default function ActivityChart() {
  const [data, setData] = useState<Active[]>([]);
  const theme = useTheme();
  const backgroundColor = theme.palette.background.default;
  const textColor = theme.palette.text.primary;

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
            title: { text: "Activity Historical", font: { color: textColor } },
            height: 500,
            margin: { b: 100, l: 50, r: 60, t: 50 },
            font: { color: textColor },
            xaxis: {
              title: { text: "Date" },
              tickfont: { size: 10 },
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
