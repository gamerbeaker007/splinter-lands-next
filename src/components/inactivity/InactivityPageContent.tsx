"use client";

import InactivityDashboard from "@/components/inactivity/InactivityDashboard";
import { getInactivityAnalysis } from "@/lib/backend/actions/inactivity/inactivity-actions";
import { useFilters } from "@/lib/frontend/context/FilterContext";
import { InactivityAnalysis } from "@/types/inactivity";
import { Alert, Box, CircularProgress } from "@mui/material";
import { useEffect, useState } from "react";

export default function InactivityPageContent() {
  const [data, setData] = useState<InactivityAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { filters } = useFilters();

  useEffect(() => {
    if (!filters) return;

    async function fetchData() {
      try {
        setLoading(true);
        const result = await getInactivityAnalysis(filters);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [filters]);

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
