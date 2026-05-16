import LandManagerPageSkeleton from "@/app/land-manager/loading";
import LandManagerPage from "@/components/land-manager/LandManagerPage";
import { getAuthStatus } from "@/lib/backend/actions/auth-actions";
import { getLandManagerConfig } from "@/lib/backend/actions/land-manager/config-actions";
import { getProductionOverview } from "@/lib/backend/actions/land-manager/overview-actions";
import { Suspense } from "react";

async function LandManagerContent() {
  const auth = await getAuthStatus();
  const [config, overview] = await Promise.all([
    getLandManagerConfig(),
    auth.authenticated
      ? getProductionOverview()
      : Promise.resolve({ regions: [] }),
  ]);

  return (
    <LandManagerPage
      auth={auth}
      config={config}
      allRegions={overview.regions}
    />
  );
}

export default function LandManagerRoute() {
  return (
    <Suspense fallback={<LandManagerPageSkeleton />}>
      <LandManagerContent />
    </Suspense>
  );
}
