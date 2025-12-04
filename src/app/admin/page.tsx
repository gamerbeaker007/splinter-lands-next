// app/admin/page.tsx
import CacheSectionServer from "@/components/admin/CacheSectionServer";
import LogSectionServer from "@/components/admin/LogSectionServer";
import MemorySectionServer from "@/components/admin/MemorySectionServer";
import SignOutButton from "@/components/admin/SingOutButton";
import { authOptions } from "@/lib/backend/auth/authOptions";
import { CircularProgress, Container, Typography } from "@mui/material";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";

async function AdminContent() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/signin");
  }

  return (
    <>
      <Typography variant="h2">Admin Dashboard</Typography>
      <Typography variant="body1">Welcome, {session.user?.name}!</Typography>
      <SignOutButton />

      <Suspense fallback={<CircularProgress />}>
        <CacheSectionServer />
        <MemorySectionServer />
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
