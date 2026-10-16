"use client";

import { useAsyncData } from "@/hooks/useAsyncData";
import { getResourceMetricsData } from "@/lib/backend/actions/resources/metrics-actions";
import { Skeleton, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import ResourcePPLineChart from "./ResourcePPLineChart";

export function HistoricalProductionPP() {
  const { data, loading } = useAsyncData(
    "resource-metrics",
    () => getResourceMetricsData(),
    { errorMessage: "Failed to load resource metrics" }
  );

  return (
    <Box mt={4}>
      <Typography variant="h4" mb={2}>
        Historical Boosted PP
      </Typography>

      {loading && !data ? (
        <Skeleton variant="rectangular" width="100%" height={300} />
      ) : (
        data && <ResourcePPLineChart data={data} />
      )}
    </Box>
  );
}
