import LandManagerPageSkeleton from "@/app/land-manager/loading";
import { MaintenanceGuard } from "@/components/guard/MaintenanceGuard";
import LandManagerProvider from "@/components/land-manager/LandManagerProvider";
import { getAuthStatus } from "@/lib/backend/actions/auth-actions";
import { getLandManagerConfig } from "@/lib/backend/actions/land-manager/config-actions";
import { getProductionOverview } from "@/lib/backend/actions/land-manager/overview-actions";
import { createDefaultLandManagerConfig } from "@/types/landManager";
import { Container } from "@mui/material";
import { ReactNode, Suspense } from "react";

async function LandManagerLayoutContent({ children }: { children: ReactNode }) {
  const auth = await getAuthStatus();

  const [config, overview] = await Promise.all([
    getLandManagerConfig(),
    auth.authenticated
      ? getProductionOverview()
      : Promise.resolve({ regions: [] }),
  ]);

  const resolvedConfig =
    config ?? createDefaultLandManagerConfig(auth.username ?? "");

  return (
    <LandManagerProvider
      auth={auth}
      initialConfig={resolvedConfig}
      allRegions={overview.regions}
    >
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
