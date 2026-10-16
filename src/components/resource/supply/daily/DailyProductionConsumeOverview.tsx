"use client";

import { useAsyncData } from "@/hooks/useAsyncData";
import { getLatestResourceSupply } from "@/lib/backend/actions/resources/supply-actions";
import { Box } from "@mui/material";
import { ResourceCard } from "./ResrouceCard";

export function DailyProduceConsumeOverview() {
  const { data: latestResourcesSupply } = useAsyncData(
    "latest-resource-supply",
    () => getLatestResourceSupply(),
    { errorMessage: "Failed to load resource supply" }
  );

  return (
    <Box display="flex" flexWrap="wrap" gap={2}>
      {latestResourcesSupply?.resource &&
        Object.entries(latestResourcesSupply.resource).map(
          ([resourceName, row]) => (
            <ResourceCard
              key={resourceName}
              resourceName={resourceName}
              row={row}
            />
          )
        )}
    </Box>
  );
}
