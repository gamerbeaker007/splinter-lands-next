"use client";

import { ResourceTracking } from "@/generated/prisma/client";
import { getResourceMetricsData } from "@/lib/backend/actions/resources/metrics-actions";
import { Skeleton, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import { useEffect, useState, useTransition } from "react";
import ResourcePPLineChart from "./ResourcePPLineChart";

export function HistoricalProductionPP() {
  const [data, setData] = useState<ResourceTracking[] | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      try {
        const result = await getResourceMetricsData();
        setData(result);
      } catch (error) {
        console.error("Failed to load resource metrics:", error);
      }
    });
  }, []);

  return (
    <Box mt={4}>
      <Typography variant="h4" mb={2}>
        Historical Boosted PP
      </Typography>

      {isPending && !data ? (
        <Skeleton variant="rectangular" width="100%" height={300} />
      ) : (
        data && <ResourcePPLineChart data={data} />
      )}
    </Box>
  );
}
