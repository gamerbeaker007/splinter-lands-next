"use client";

import { ResourceActiveSummaryCard } from "@/components/region-overview/active/ResrouceSummaryCard";
import { getActiveProductionSummary } from "@/lib/backend/actions/region/production-actions";
import { useFilters } from "@/lib/frontend/context/FilterContext";
import { RegionActiveSummary } from "@/types/regionActiveSummary";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";

export default function ActiveSummary() {
  const { filters } = useFilters();
  const [data, setData] = useState<Record<string, RegionActiveSummary>>({});

  useEffect(() => {
    if (!filters) return;

    (async () => {
      try {
        const raw = await getActiveProductionSummary(filters);
        setData(raw);
      } catch (error) {
        console.error(error);
      }
    })();
  }, [filters]);

  return (
    <>
      <Typography variant={"h4"}>
        Production points (PP) and activated{" "}
      </Typography>
      <Box display={"flex"} flexWrap={"wrap"} gap={2} justifyContent={"center"}>
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
