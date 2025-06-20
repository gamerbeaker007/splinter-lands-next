// app/admin/page.tsx
import CacheSection from "@/components/admin/CacheSection";
import LogSection from "@/components/admin/LogSections";
import MemorySection from "@/components/admin/MemorySection";
import SignOutButton from "@/components/admin/SingOutButton";
import { authOptions } from "@/lib/backend/auth/authOptions";
import { Container, Typography } from "@mui/material";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/signin");
  }

  return (
    <Container>
      <Typography variant="h2">Admin Dashboard</Typography>
      <Typography variant="body1">Welcome, {session.user?.name}!</Typography>
      <SignOutButton />
      <CacheSection />
      <MemorySection />
      <LogSection />
    </Container>
  );
}
