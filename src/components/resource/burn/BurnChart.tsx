"use client";

import { FullscreenPlotWrapper } from "@/components/ui/graph/FullscreenPlotWrapper";
import { BurnCardsDataPoint } from "@/types/burn";
import { Box } from "@mui/material";

interface BurnChartProps {
  data: BurnCardsDataPoint[];
}

export default function BurnChart({ data }: BurnChartProps) {
  // Sort data by date ascending for proper plotting
  const sortedData = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const convertToPositiveData = sortedData.map((record) => ({
    ...record,
    balance: record.balance * -1 || 0,
  }));

  // Get unique dates sorted
  const uniqueDates = Array.from(
    new Set(
      convertToPositiveData.map(
        (d) => new Date(d.date).toISOString().split("T")[0]
      )
    )
  ).sort();

  const tokens = ["GLINT", "DEC", "MERITS", "CINDER"];

  const traces: Partial<Plotly.PlotData>[] = tokens.map((token) => {
    const tokenData = convertToPositiveData.filter((d) => d.token === token);

    // Create a map of date to balance for this token
    const dataMap = new Map(
      tokenData.map((d) => [
        new Date(d.date).toISOString().split("T")[0],
        Number(d.balance) || 0,
      ])
    );

    // For each unique date, get the value or null if missing
    const yValues = uniqueDates.map((date) => dataMap.get(date) ?? null);

    return {
      x: uniqueDates,
      y: yValues,
      name: token,
      type: "scatter",
      mode: "lines+markers",
      connectgaps: false, // Don't connect gaps where data is missing
    };
  });

  const layout: Partial<Plotly.Layout> = {
    title: { text: "Daily Burned Cards For Tokens" },
    xaxis: {
      title: { text: "Date" },
    },
    yaxis: {
      title: { text: "Amount" },
    },
    hovermode: "x unified",
  };

  return (
    <Box mt={3} height={600}>
      <FullscreenPlotWrapper data={traces} layout={layout} />
    </Box>
  );
}
