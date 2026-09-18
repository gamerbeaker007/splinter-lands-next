// app/admin/page.tsx
import CacheSectionServer from "@/components/admin/CacheSectionServer";
import DbSizeSection from "@/components/admin/DbSizeSection";
import DirectDonationsSectionServer from "@/components/admin/DirectDonationsSectionServer";
import DonationsMadeSection from "@/components/admin/DonationsMadeSection";
import LogSectionServer from "@/components/admin/LogSectionServer";
import MemorySectionServer from "@/components/admin/MemorySectionServer";
import SignOutButton from "@/components/admin/SingOutButton";
import WorkerStatusSection from "@/components/admin/WorkerStatusSection";
import { getAuthStatus } from "@/lib/backend/actions/auth-actions";
import { isAdminUser } from "@/lib/backend/auth/adminAuth";
import { CircularProgress, Container, Stack, Typography } from "@mui/material";
import { redirect } from "next/navigation";
import { Suspense } from "react";

async function AdminContent() {
  const auth = await getAuthStatus();

  if (!auth.authenticated || !auth.username) {
    redirect("/");
  }

  if (!isAdminUser(auth.username)) {
    redirect("/");
  }

  return (
    <>
      <Stack
        direction="column"
        alignItems="left"
        justifyContent="space-between"
        mb={2}
      >
        <Typography variant="h2">Admin Dashboard</Typography>
        <Typography variant="body1">Welcome, {auth.username}!</Typography>
        <Typography variant="caption" color="text.secondary">
          Version: {process.env.APP_VERSION ?? "dev"}
        </Typography>
        <SignOutButton />
      </Stack>

      <Suspense fallback={<CircularProgress />}>
        <WorkerStatusSection />
        <CacheSectionServer />
        <DbSizeSection />
        <MemorySectionServer />
        <DonationsMadeSection />
        <DirectDonationsSectionServer />
        <LogSectionServer />
      </Suspense>
    </>
  );
}

export default function AdminPage() {
  return (
    <Container maxWidth="xl" sx={{ px: { xs: 2, md: 6, lg: 12 } }}>
      <Suspense fallback={<CircularProgress />}>
        <AdminContent />
      </Suspense>
    </Container>
  );
}
