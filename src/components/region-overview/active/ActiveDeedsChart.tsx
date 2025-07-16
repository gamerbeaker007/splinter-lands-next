"use client";

import { FullscreenPlotWrapper } from "@/components/ui/graph/FullscreenPlotWrapper";
import { useFilters } from "@/lib/frontend/context/FilterContext";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";

export default function ActiveDeedsChart() {
  const { filters } = useFilters();
  const [data, setData] = useState<Record<string, Record<string, number>>>({});
  const [xTitle, setXTitle] = useState<string>("");

  useEffect(() => {
    if (!filters) return;

    fetch("/api/region/active", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filters),
    })
      .then((res) => res.json())
      .then((raw) => {
        if (filters.filter_regions?.length === 1) {
          setXTitle("Tract");
        } else {
          setXTitle("Region");
        }
        setData(raw);
      })
      .catch(console.error);
  }, [filters]);

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
