import DeedHistoryDashboard from "@/components/player-overview/deed-history/DeedHistoryDashboard";
import DeedSelector from "@/components/player-overview/deed-history/DeedSelector";
import { getDeedHistory } from "@/lib/backend/actions/deed/deed-history-actions";
import { Box, Skeleton, Typography } from "@mui/material";
import { Suspense } from "react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function DeedHistoryContent({ deedUid }: { deedUid: string }) {
  try {
    const { projects, harvests } = await getDeedHistory(deedUid);

    return (
      <>
        <DeedHistoryDashboard
          deedUid={deedUid}
          projects={projects.data}
          harvests={harvests.data}
        />
      </>
    );
  } catch (error) {
    return (
      <Typography color="error" sx={{ padding: "20px" }}>
        Error loading deed history: {(error as Error).message}
      </Typography>
    );
  }
}

function DeedHistoryLoading() {
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

async function PageContent({ params }: PageProps) {
  const { slug: deedUid } = await params;

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h4">Deed History - {deedUid}</Typography>
        <DeedSelector currentDeedUid={deedUid} />
      </Box>
      <Suspense fallback={<DeedHistoryLoading />}>
        <DeedHistoryContent deedUid={deedUid} />
      </Suspense>
    </Box>
  );
}

export default function DeedHistoryPage({ params }: PageProps) {
  return (
    <Suspense fallback={<DeedHistoryLoading />}>
      <PageContent params={params} />
    </Suspense>
  );
}
