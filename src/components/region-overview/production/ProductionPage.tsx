"use client";

import { ProductionOverviewPage } from "@/components/region-overview/production/ProductionOverview";
import { HistoricalProductionPP } from "./HistoricalProductionPP";

export function ProductionPage() {
  return (
    <>
      <ProductionOverviewPage />
      <HistoricalProductionPP />
    </>
  );
}
