import LandManagerPageSkeleton from "@/app/land-manager/loading";
import { MaintenanceGuard } from "@/components/guard/MaintenanceGuard";
import LandManagerProvider from "@/components/land-manager/LandManagerProvider";
import { getAuthStatus } from "@/lib/backend/actions/auth-actions";
import { getLandManagerConfig } from "@/lib/backend/actions/land-manager/config-actions";
import { createDefaultLandManagerConfig } from "@/types/landManager";
import { Container } from "@mui/material";
import { ReactNode, Suspense } from "react";

async function LandManagerLayoutContent({ children }: { children: ReactNode }) {
  const auth = await getAuthStatus();

  // The player's regions (a JWT read) load in the browser — see
  // LandManagerContextProvider. Only the session check and the stored config
  // are server-side.
  const config = await getLandManagerConfig();

  const resolvedConfig =
    config ?? createDefaultLandManagerConfig(auth.username ?? "");

  return (
    <LandManagerProvider auth={auth} initialConfig={resolvedConfig}>
      {children}
    </LandManagerProvider>
  );
}

export default function LandManagerLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Container maxWidth={false} sx={{ px: { xs: 1, md: 3, lg: 6 } }}>
      <Suspense fallback={<LandManagerPageSkeleton />}>
        <MaintenanceGuard>
          <LandManagerLayoutContent>{children}</LandManagerLayoutContent>
        </MaintenanceGuard>
      </Suspense>
    </Container>
  );
}
