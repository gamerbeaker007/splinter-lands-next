"use client";

import { Box } from "@mui/material";
import { DailyProduceConsumeOverview } from "./daily/DailyProductionConsumeOverview";
import { ProduceConsumeHistoricalOverview } from "./historical/ProduceConsumeHistoricalOverview";

export function SupplyPage() {
  return (
    <Box mt={2} mb={4}>
      <DailyProduceConsumeOverview />
      <ProduceConsumeHistoricalOverview />
    </Box>
  );
}
