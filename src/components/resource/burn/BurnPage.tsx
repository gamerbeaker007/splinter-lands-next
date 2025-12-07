"use client";

import { useDailyBurnedBalances } from "@/hooks/useDailyBurnedBalances";
import { Box, CircularProgress, Typography } from "@mui/material";
import BurnChart from "./BurnChart";
import BurnOverview from "./BurnOverview";

export default function BurnPage() {
  const { data, loading, error } = useDailyBurnedBalances();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box mt={2}>
        <Typography variant="h6" color="error">
          Error loading burn data: {error.message}
        </Typography>
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Box mt={2}>
        <Typography variant="h6" color="text.secondary">
          No burn data available
        </Typography>
      </Box>
    );
  }

  // Get the records of the last date
  const latestDate = data[0].date;
  const latestDateString = new Date(latestDate).toISOString().split("T")[0];

  const latestData = data.filter((record) => {
    const recordDateString = new Date(record.date).toISOString().split("T")[0];
    return recordDateString === latestDateString;
  });

  return (
    <Box mt={2} display={"flex"} flexDirection={"column"}>
      <BurnOverview latestData={latestData} />
      <BurnChart data={data} />
    </Box>
  );
}
