"use client";

import { ResourceActiveSummaryCard } from "@/components/region-overview/active/ResrouceSummaryCard";
import { useAsyncData } from "@/hooks/useAsyncData";
import { getActiveProductionSummary } from "@/lib/backend/actions/region/production-actions";
import { useFilters } from "@/lib/frontend/context/FilterContext";
import { RegionActiveSummary } from "@/types/regionActiveSummary";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

const NO_SUMMARY: Record<string, RegionActiveSummary> = {};

export default function ActiveSummary() {
  const { filters } = useFilters();
  const { data = NO_SUMMARY } = useAsyncData(
    filters ? JSON.stringify(filters) : null,
    () => getActiveProductionSummary(filters!),
    { errorMessage: "Failed to load active production summary" }
  );

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
