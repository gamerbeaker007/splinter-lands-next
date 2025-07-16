"use client";

import ActiveDeedsChart from "@/components/region-overview/active/ActiveDeedsChart";
import ActiveSummary from "@/components/region-overview/active/ActiveSummary";
import ActivityChart from "./ActivityChart";
import { Box } from "@mui/material";

export function ActivityPage() {
  return (
    <Box display="flex" flexDirection="column" gap={4}>
      <ActivityChart />
      <ActiveSummary />
      <ActiveDeedsChart />
    </Box>
  );
}
