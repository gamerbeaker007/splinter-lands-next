"use client";

import InactivityDashboard from "@/components/inactivity/InactivityDashboard";
import { useAsyncData } from "@/hooks/useAsyncData";
import { getInactivityAnalysis } from "@/lib/backend/actions/inactivity/inactivity-actions";
import { useFilters } from "@/lib/frontend/context/FilterContext";
import { Alert, Box, CircularProgress } from "@mui/material";

export default function InactivityPageContent() {
  const { filters } = useFilters();

  const {
    data,
    loading: fetching,
    error,
  } = useAsyncData(
    filters ? JSON.stringify(filters) : null,
    () => getInactivityAnalysis(filters!),
    { errorMessage: "Failed to load data", keepPreviousData: false }
  );
  // Filters arrive from context after mount; spin until the first load ran.
  const loading = fetching || !filters;

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box p={4}>
        <Alert severity="info">No data available</Alert>
      </Box>
    );
  }

  return <InactivityDashboard data={data} />;
}
