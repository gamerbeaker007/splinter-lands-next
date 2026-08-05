"use client";

import WorksiteContent from "@/components/land-manager/worksites/WorksiteContent";
import { useLandManagerContext } from "@/lib/frontend/context/LandManagerContext";

export default function WorksitePage() {
  const { auth, config, triggerRefresh } = useLandManagerContext();

  return (
    <WorksiteContent
      username={auth.username ?? ""}
      enabledRegions={config.enabled_regions}
      strategies={config.make_harvestable_strategies}
      onSuccess={triggerRefresh}
    />
  );
}
