"use client";

import ErrorComponent from "@/components/ui/ErrorComponent";
import { useAsyncData } from "@/hooks/useAsyncData";
import { loadDeedHistory } from "@/lib/frontend/player-data";
import { Box, Skeleton } from "@mui/material";
import DeedHistoryDashboard from "./DeedHistoryDashboard";

/**
 * Loads the deed's full history straight from SPL in the browser (paged
 * project + reward-action lists) and renders the dashboard.
 */
export default function DeedHistoryContent({ deedUid }: { deedUid: string }) {
  const { data, loading, error } = useAsyncData(
    deedUid,
    () => loadDeedHistory(deedUid),
    { keepPreviousData: false, errorMessage: "Failed to load deed history" }
  );

  if (error) return <ErrorComponent title={error} />;
  if (loading || !data) return <DeedHistoryLoading />;

  return (
    <DeedHistoryDashboard
      projects={data.projects.data}
      harvests={data.harvests.data}
    />
  );
}

export function DeedHistoryLoading() {
  return (
    <Box sx={{ padding: 2 }}>
      <Skeleton variant="rectangular" height={400} sx={{ mb: 2 }} />
      <Box sx={{ display: "flex", gap: 2 }}>
        <Skeleton variant="rectangular" height={300} sx={{ flex: 1 }} />
        <Skeleton variant="rectangular" height={300} sx={{ flex: 1 }} />
      </Box>
    </Box>
  );
}
