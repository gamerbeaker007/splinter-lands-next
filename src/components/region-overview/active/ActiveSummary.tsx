"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import { useFilters } from "@/lib/frontend/context/FilterContext";
import { ResourceActiveSummaryCard } from "@/components/region-overview/active/ResrouceSummaryCard";
import { RegionActiveSummary } from "@/types/regionActiveSummary";
import Typography from "@mui/material/Typography";

export default function ActiveSummary() {
  const { filters } = useFilters();
  const [data, setData] = useState<Record<string, RegionActiveSummary>>({});

  useEffect(() => {
    if (!filters) return;

    fetch("/api/region/active/production", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filters),
    })
      .then((res) => res.json())
      .then((raw) => {
        setData(raw);
      })
      .catch(console.error);
  }, [filters]);

  return (
    <>
      <Typography variant={"h4"} mt={4}>
        Production points (PP) and activated{" "}
      </Typography>
      <Box
        display={"flex"}
        flexWrap={"wrap"}
        gap={2}
        mt={2}
        justifyContent={"center"}
      >
        {Object.entries(data).map(([resource, summary]) => (
          <ResourceActiveSummaryCard
            key={resource}
            resource={resource}
            summary={summary}
          />
        ))}
      </Box>
    </>
  );
}
