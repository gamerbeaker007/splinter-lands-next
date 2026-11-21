"use client";

import { ResourceSupplyOverview } from "@/types/resourceSupplyOverview";
import { Box, Typography } from "@mui/material";
import { ResourceCard } from "./ResrouceCard";

export function DailyProduceConsumeOverview({
  data,
}: {
  data: ResourceSupplyOverview | undefined;
}) {
  if (!data) return null;
  if (Object.keys(data.resource).length === 0) {
    return (
      <Typography color="text.secondary">
        No current data for the selected resources.
      </Typography>
    );
  }

  return (
    <Box display="flex" flexWrap="wrap" gap={2}>
      {Object.entries(data.resource).map(([resourceName, row]) => (
        <ResourceCard
          key={resourceName}
          resourceName={resourceName}
          row={row}
        />
      ))}
    </Box>
  );
}
