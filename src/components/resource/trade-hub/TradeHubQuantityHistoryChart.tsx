import { FullscreenPlotWrapper } from "@/components/ui/graph/FullscreenPlotWrapper";
import { ResourceHubMetrics } from "@/generated/prisma/client";
import { RESOURCE_COLOR_MAP } from "@/lib/shared/statics";
import { Box } from "@mui/material";
import { ScatterData } from "plotly.js";
import React from "react";

interface Props {
  data: ResourceHubMetrics[];
}

const TradeHubQuantityHistoryChart: React.FC<Props> = ({ data }) => {
  const grouped: Record<
    string,
    { x: string[]; resourceY: number[]; decY: number[] }
  > = {};

  data.forEach((entry) => {
    const symbol = entry.token_symbol;
    const date = new Date(entry.date).toISOString().split("T")[0];
    if (!grouped[symbol]) {
      grouped[symbol] = { x: [], resourceY: [], decY: [] };
    }
    grouped[symbol].x.push(date);
    grouped[symbol].resourceY.push(Number(entry.resource_quantity));
    grouped[symbol].decY.push(Number(entry.dec_quantity));
  });

  const traces: Partial<ScatterData>[] = Object.entries(grouped).flatMap(
    ([symbol, val]) => {
      const color = RESOURCE_COLOR_MAP[symbol] || "white";
      return [
        {
          x: val.x,
          y: val.resourceY,
          type: "scatter" as const,
          mode: "lines" as const,
          name: symbol,
          legendgroup: symbol,
          yaxis: "y1",
          line: { color },
        },
        {
          x: val.x,
          y: val.decY,
          type: "scatter" as const,
          mode: "lines" as const,
          name: `${symbol} DEC`,
          legendgroup: symbol,
          yaxis: "y2",
          line: { color, dash: "dash" as const },
          showlegend: true,
        },
      ];
    }
  );

  return (
    <Box sx={{ width: "100%", height: 500 }}>
      <FullscreenPlotWrapper
        data={traces}
        layout={{
          title: { text: "Pool quantities over time" },
          legend: { font: { size: 10 }, orientation: "v" },
          xaxis: { title: { text: "Date" }, showgrid: false },
          yaxis: { title: { text: "Resource quantity" } },
          yaxis2: {
            title: { text: "DEC quantity" },
            overlaying: "y",
            side: "right",
          },
        }}
      />
    </Box>
  );
};

export default TradeHubQuantityHistoryChart;
