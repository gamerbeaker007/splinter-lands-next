"use client";

import TractDeedOverviewPage from "@/components/region-overview/tract-deed-overview/TractAnalysisPage";
import RegionOverviewLayout from "../layout";

const tractFilterConfig = {
  regions: false,
  tracts: false,
  plots: true,
  attributes: true,
  player: false,
  sorting: true,
};

export default function TractAnalysisPage() {
  return (
    <RegionOverviewLayout filterOptions={tractFilterConfig}>
      <TractDeedOverviewPage />
    </RegionOverviewLayout>
  );
}
