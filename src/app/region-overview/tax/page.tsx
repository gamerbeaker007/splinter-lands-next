"use client";

import { TaxPage } from "@/components/region-overview/tax/TaxPage";
import RegionOverviewLayout from "../layout";

const taxFilterConfig = {
  regions: true,
  tracts: true,
  plots: false,
  attributes: false,
  player: false,
  sorting: false,
};

export default function RegionTaxPage() {
  return (
    <RegionOverviewLayout filterOptions={taxFilterConfig}>
      <TaxPage />
    </RegionOverviewLayout>
  );
}
