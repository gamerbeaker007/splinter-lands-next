"use client";

import { Box } from "@mui/material";
import { useEffect, useState } from "react";
import { ResourceCard } from "./ResrouceCard";
import { ResourceSupplyOverview } from "@/types/resourceSupplyOverview";

export function DailyProduceConsumeOverview() {
  const [latestResourcesSupply, setlatestResourcesSupply] =
    useState<ResourceSupplyOverview | null>(null);

  useEffect(() => {
    fetch("/api/resource/supply/latest", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then(setlatestResourcesSupply)
      .catch(console.error);
  }, []);

  return (
    <>
      <Box display="flex" flexWrap="wrap" gap={2}>
        {latestResourcesSupply?.resource &&
          Object.entries(latestResourcesSupply.resource).map(
            ([resourceName, row]) => (
              <ResourceCard
                key={resourceName}
                resourceName={resourceName}
                row={row}
              />
            ),
          )}
      </Box>
    </>
  );
}
