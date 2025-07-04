import { ResourceHubMetrics } from "@/generated/prisma";
import { Box, useTheme } from "@mui/material";
import Plot from "react-plotly.js";
import { ScatterData } from "plotly.js";
import React from "react";

interface Props {
  data: ResourceHubMetrics[];
}

const TradeHubCumulativeBurnChart: React.FC<Props> = ({ data }) => {
  const theme = useTheme();
  const backgroundColor = theme.palette.background.default;
  const textColor = theme.palette.text.primary;
  const gridLineColor = theme.palette.divider;

  // Aggregate daily DEC volume and burned
  const dailyMap: Record<string, number> = {};
  const dateList: string[] = [];

  data.forEach((entry) => {
    const date = new Date(entry.date).toISOString().split("T")[0];
    const burned = Number(entry.dec_volume_1) * 0.05;

    if (!dailyMap[date]) {
      dailyMap[date] = 0;
      dateList.push(date);
    }
    dailyMap[date] += burned;
  });

  const dailyBurns: number[] = [];
  const cumulativeBurns: number[] = [];
  let cumulative = 0;

  dateList.forEach((date) => {
    const daily = dailyMap[date];
    cumulative += daily;
    dailyBurns.push(daily);
    cumulativeBurns.push(cumulative);
  });

  const traces: Partial<ScatterData>[] = [
    {
      x: dateList,
      y: dailyBurns,
      type: "bar",
      name: "Daily DEC Burned",
      marker: { color: "purple" },
    },
    {
      x: dateList,
      y: cumulativeBurns,
      type: "scatter",
      name: "Cumulative Burn",
      yaxis: "y2",
      mode: "lines",
      line: { dash: "dot", color: "lightgray" },
    },
  ];

  return (
    <Box
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
        data={traces}
        layout={{
          title: { text: "Daily DEC Burn and Cumulative DEC Burn" },
          plot_bgcolor: backgroundColor,
          paper_bgcolor: backgroundColor,
          font: { color: textColor },
          legend: {
            font: { size: 10, color: textColor },
            orientation: "v",
          },
          xaxis: {
            title: { text: "Date" },
            showgrid: false,
          },
          yaxis: {
            title: { text: "Burned DEC" },
            gridcolor: gridLineColor,
          },
          yaxis2: {
            title: { text: "Cumulative Burned DEC" },
            overlaying: "y",
            side: "right",
            showgrid: false,
            zeroline: false,
          },
          margin: { t: 50, b: 40 },
        }}
        style={{ width: "100%", height: "500px" }}
        useResizeHandler
      />
    </Box>
  );
};

export default TradeHubCumulativeBurnChart;
