import { FullscreenPlotWrapper } from "@/components/ui/graph/FullscreenPlotWrapper";
import { ResourceHubMetrics } from "@/generated/prisma";
import { paddedSMA, paddedEMA } from "@/lib/utils/movingAverages";
import { Box } from "@mui/material";
import { ScatterData } from "plotly.js";
import React from "react";

interface Props {
  data: ResourceHubMetrics[];
}

const TradeHubCumulativeBurnChart: React.FC<Props> = ({ data }) => {
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

  const sma = paddedSMA(dailyBurns, 20);
  const ema = paddedEMA(dailyBurns, 20);

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
    {
      x: dateList,
      y: sma,
      type: "scatter",
      name: "SMA (20days)",
      mode: "lines",
      line: { color: "blue" },
    },
    {
      x: dateList,
      y: ema,
      type: "scatter",
      name: "EMA (20days)",
      mode: "lines",
      line: { color: "red" },
    },
  ];

  return (
    <Box
      sx={{
        width: "100%",
        height: 500,
      }}
    >
      <FullscreenPlotWrapper
        data={traces}
        layout={{
          title: { text: "Daily DEC Burn and Cumulative DEC Burn" },
          legend: {
            font: { size: 10 },
            orientation: "v",
          },
          xaxis: {
            title: { text: "Date" },
            showgrid: false,
          },
          yaxis: {
            title: { text: "Burned DEC" },
          },
          yaxis2: {
            title: { text: "Cumulative Burned DEC" },
            overlaying: "y",
            side: "right",
            showgrid: false,
            zeroline: false,
          },
        }}
      />
    </Box>
  );
};

export default TradeHubCumulativeBurnChart;
