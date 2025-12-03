// app/admin/page.tsx
import CacheSection from "@/components/admin/CacheSection";
import LogSection from "@/components/admin/LogSections";
import MemorySection from "@/components/admin/MemorySection";
import SignOutButton from "@/components/admin/SingOutButton";
import { authOptions } from "@/lib/backend/auth/authOptions";
import { Container, Typography } from "@mui/material";
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
      <CacheSection />
      <MemorySection />
      <LogSection />
    </>
  );
}

export default function AdminPage() {
  return (
    <Container maxWidth="xl" sx={{ px: { xs: 2, md: 6, lg: 12 } }}>
      <Suspense fallback={<Typography>Loading...</Typography>}>
        <AdminContent />
      </Suspense>
    </Container>
  );
}
