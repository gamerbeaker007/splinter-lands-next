"use client";

import WorkerCardPicksCell from "@/components/land-manager/production/rental-actions/WorkerCardPicksCell";
import { parseLandStatsResources } from "@/lib/filters";
import { formatFixed } from "@/lib/formatters";
import { WorkerPlanItem } from "@/types/landManager";
import { Typography } from "@mui/material";
import { WorkerPlotColumn } from "./WorkerPlotTable";

export function buildConfirmColumns(mode: "buy" | "rent"): WorkerPlotColumn[] {
  return [
    {
      header: "Plot",
      render: (item) => (
        <Typography variant="caption" fontFamily="monospace" noWrap>
          R{item.plot.region_number} · T{item.plot.tract_number} · P
          {item.plot.plot_number}
        </Typography>
      ),
    },
    {
      header: "Resource",
      render: (item) => (
        <Typography variant="caption">
          {item.plot.resource_symbol ??
            parseLandStatsResources(item.plot.land_stats)[0] ??
            "—"}
        </Typography>
      ),
    },
    {
      header: "Worksite",
      render: (item) => (
        <Typography variant="caption">
          {item.plot.worksite_type ?? "—"}
        </Typography>
      ),
    },
    {
      header: "DEC",
      align: "right",
      render: (item) => (
        <Typography variant="caption">
          {formatFixed(item.plot_total_dec)}
        </Typography>
      ),
    },
    {
      header: "Workers",
      render: (item: WorkerPlanItem) => (
        <WorkerCardPicksCell picks={item.picks} mode={mode} />
      ),
    },
  ];
}
