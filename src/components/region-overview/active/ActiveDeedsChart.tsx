"use client";

import { FullscreenPlotWrapper } from "@/components/ui/graph/FullscreenPlotWrapper";
import { useAsyncData } from "@/hooks/useAsyncData";
import { getActiveDeedCountByRegion } from "@/lib/backend/actions/region/active-actions";
import { useFilters } from "@/lib/frontend/context/FilterContext";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

const NO_COUNTS: Record<string, { active: number; inactive: number }> = {};

export default function ActiveDeedsChart() {
  const { filters } = useFilters();
  const { data: loaded } = useAsyncData(
    filters ? JSON.stringify(filters) : null,
    async () => ({
      counts: await getActiveDeedCountByRegion(filters!),
      xTitle: filters!.filter_regions?.length === 1 ? "Tract" : "Region",
    }),
    { errorMessage: "Failed to load active deed counts" }
  );
  const data = loaded?.counts ?? NO_COUNTS;
  const xTitle = loaded?.xTitle ?? "";

  const regionLabels = Object.keys(data);
  const activeCounts = regionLabels.map((key) => data[key].active);
  const inactiveCounts = regionLabels.map((key) => data[key].inactive);

  return (
    <>
      <Typography variant={"h4"}>Activated deeds</Typography>

      <Box
        sx={{
          width: "100%",
          height: 500,
        }}
      >
        <FullscreenPlotWrapper
          data={[
            {
              x: regionLabels,
              y: activeCounts,
              name: "Active",
              type: "bar",
              marker: { color: "steelblue" },
            },
            {
              x: regionLabels,
              y: inactiveCounts,
              name: "Inactive",
              type: "bar",
              marker: { color: "#94a3b8" },
            },
          ]}
          layout={{
            title: { text: "Active Deeds" },
            barmode: "stack",
            xaxis: {
              title: { text: xTitle },
              showgrid: false,
            },
            yaxis: {
              title: { text: "Deeds" },
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
