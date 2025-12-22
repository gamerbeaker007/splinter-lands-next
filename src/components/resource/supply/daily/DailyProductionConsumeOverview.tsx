"use client";

import { getLatestResourceSupply } from "@/lib/backend/actions/resources/supply-actions";
import { ResourceSupplyOverview } from "@/types/resourceSupplyOverview";
import { Box } from "@mui/material";
import { useEffect, useState } from "react";
import { ResourceCard } from "./ResrouceCard";

export function DailyProduceConsumeOverview() {
  const [latestResourcesSupply, setlatestResourcesSupply] =
    useState<ResourceSupplyOverview | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getLatestResourceSupply();
        setlatestResourcesSupply(data);
      } catch (error) {
        console.error(error);
      }
    })();
  }, []);

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
