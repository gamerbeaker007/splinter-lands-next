import { FullscreenPlotWrapper } from "@/components/ui/graph/FullscreenPlotWrapper";
import { ResourceHubMetrics } from "@/generated/prisma/client";
import { RESOURCE_COLOR_MAP } from "@/lib/shared/statics";
import { Box } from "@mui/material";
import { ScatterData } from "plotly.js";
import React from "react";

interface Props {
  data: ResourceHubMetrics[];
}

const TradeHubVolumeChart: React.FC<Props> = ({ data }) => {
  const resourceMap: Record<
    string,
    { x: string[]; resourceVolumeY: number[]; decVolumeY: number[] }
  > = {};
  const dailyDecMap: Record<string, number> = {};
  const dateList: string[] = [];

  data.forEach((entry) => {
    const date = new Date(entry.date).toISOString().split("T")[0];
    const symbol = entry.token_symbol;
    const resourceVolume = Number(entry.resource_volume_1 ?? 0);
    const decVolume = Number(entry.dec_volume_1 ?? 0);

    if (!resourceMap[symbol]) {
      resourceMap[symbol] = { x: [], resourceVolumeY: [], decVolumeY: [] };
    }
    resourceMap[symbol].x.push(date);
    resourceMap[symbol].resourceVolumeY.push(resourceVolume);
    resourceMap[symbol].decVolumeY.push(decVolume);

    if (!dailyDecMap[date]) {
      dailyDecMap[date] = 0;
      dateList.push(date);
    }
    dailyDecMap[date] += decVolume;
  });

  const dailyTotalX: string[] = dateList;
  const dailyTotalY: number[] = dateList.map((date) => dailyDecMap[date]);

  const traces: Partial<ScatterData>[] = [
    ...Object.entries(resourceMap).flatMap(([symbol, val]) => {
      const color = RESOURCE_COLOR_MAP[symbol] || "white";
      return [
        {
          x: val.x,
          y: val.resourceVolumeY,
          type: "scatter" as const,
          mode: "lines" as const,
          name: symbol,
          legendgroup: symbol,
          yaxis: "y1",
          line: { color },
        },
        {
          x: val.x,
          y: val.decVolumeY,
          type: "scatter" as const,
          mode: "lines" as const,
          name: `${symbol} DEC vol`,
          legendgroup: symbol,
          yaxis: "y2",
          line: { color, dash: "dash" as const },
          showlegend: true,
        },
      ];
    }),
    {
      x: dailyTotalX,
      y: dailyTotalY,
      type: "scatter" as const,
      mode: "lines" as const,
      name: "Total DEC volume (all pools)",
      yaxis: "y2",
      line: { color: "#9c27b0", width: 2 },
      showlegend: true,
    },
  ];

  return (
    <Box sx={{ width: "100%", height: 500 }}>
      <FullscreenPlotWrapper
        data={traces}
        layout={{
          title: { text: "24h Trade Volume" },
          legend: { font: { size: 10 }, orientation: "v" },
          xaxis: { title: { text: "Date" }, showgrid: false },
          yaxis: { title: { text: "Resource volume (24h)" } },
          yaxis2: {
            title: { text: "DEC volume (24h)" },
            overlaying: "y",
            side: "right",
          },
        }}
      />
    </Box>
  );
};

export default TradeHubVolumeChart;
