"use client";

import { FullscreenPlotWrapper } from "@/components/ui/graph/FullscreenPlotWrapper";
import { RESOURCE_COLOR_MAP } from "@/lib/shared/statics";
import { SplDeedHarvestAction } from "@/types/deedHarvest";
import { Box, Paper, Typography } from "@mui/material";
import { PlotData } from "plotly.js";

interface HarvestSummarySectionProps {
  harvests: SplDeedHarvestAction[];
}

export default function HarvestSummarySection({
  harvests,
}: HarvestSummarySectionProps) {
  // Calculate total resources harvested by resource type
  const resourceTotals: Record<string, number> = {};

  harvests.forEach((harvest) => {
    const resource = harvest.resource_symbol;
    const amount = harvest.amount_received;

    if (!resourceTotals[resource]) {
      resourceTotals[resource] = 0;
    }
    resourceTotals[resource] += amount;
  });

  // Sort by resource name
  const sortedResources = Object.keys(resourceTotals).sort();

  // Create bar chart data
  const chartData: Partial<PlotData>[] = [
    {
      x: sortedResources,
      y: sortedResources.map((r) => resourceTotals[r]),
      type: "bar",
      marker: {
        color: sortedResources.map((r) => RESOURCE_COLOR_MAP[r] || "steelblue"),
      },
      text: sortedResources.map((r) => resourceTotals[r].toFixed(2)),
      textposition: "outside",
    },
  ];

  return (
    <Paper sx={{ padding: 2 }}>
      <Typography variant="h6" gutterBottom>
        Total Resources Harvested
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Cumulative resources collected from all harvest actions
      </Typography>

      {/* Summary Stats */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2">
          <strong>Total Harvests:</strong> {harvests.length}
        </Typography>
        {sortedResources.map((resource) => (
          <Typography key={resource} variant="body2">
            <strong>{resource}:</strong> {resourceTotals[resource].toFixed(3)}
          </Typography>
        ))}
      </Box>

      {/* Bar Chart */}
      <Box sx={{ height: 400, width: "100%" }}>
        <FullscreenPlotWrapper
          data={chartData}
          layout={{
            title: {
              text: "Resources Harvested by Type",
            },
            xaxis: {
              title: { text: "Resource" },
            },
            yaxis: {
              title: { text: "Total Amount" },
            },
            showlegend: false,
            margin: { t: 40, b: 40, l: 60, r: 20 },
          }}
          config={{ responsive: true }}
        />
      </Box>
    </Paper>
  );
}
