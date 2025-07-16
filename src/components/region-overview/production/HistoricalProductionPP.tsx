"use client";

import { ResourceTracking } from "@/generated/prisma";
import Box from "@mui/material/Box";
import { useEffect, useState } from "react";
import ResourcePPLineChart from "./ResourcePPLineChart";
import { Typography } from "@mui/material";

export function HistoricalProductionPP() {
  const [data, setData] = useState<ResourceTracking[] | null>(null);

  useEffect(() => {
    fetch("/api/resource/metrics", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => res.json())
      .then((raw) => {
        setData(raw);
      })
      .catch(console.error);
  }, []);

  return (
    <Box mt={4}>
      <Typography variant="h4" mb={2}>
        Historical Boosted PP
      </Typography>

      {data && <ResourcePPLineChart data={data} />}
    </Box>
  );
}
