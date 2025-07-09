"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import { useFilters } from "@/lib/frontend/context/FilterContext";
import { useTheme } from "@mui/material";
import Typography from "@mui/material/Typography";
import { FullscreenPlotWrapper } from "@/components/ui/graph/FullscreenPlotWrapper";

export default function ActiveDeedsChart() {
  const { filters } = useFilters();
  const [data, setData] = useState<Record<string, Record<string, number>>>({});
  const [xTitle, setXTitle] = useState<string>("");
  const theme = useTheme();
  const backgroundColor = theme.palette.background.default;
  const textColor = theme.palette.text.primary;

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
      <Typography mt={4} variant={"h4"}>
        Activated deeds
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
            height: 500,
            margin: { b: 100 },
            font: { color: textColor },
            xaxis: {
              title: { text: xTitle },
              tickfont: { size: 10 },
            },
            yaxis: {
              title: { text: "Deeds" },
            },
            plot_bgcolor: backgroundColor,
            paper_bgcolor: backgroundColor,
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
