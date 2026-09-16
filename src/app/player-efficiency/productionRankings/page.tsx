"use client";

import LandFilterDrawer from "@/components/filter/LandFilterDrawer";
import { ProductionRankingsContent } from "@/components/player-efficiency/ProductionRankingsContent";
import { FilterProvider } from "@/lib/frontend/context/FilterContext";

export default function ProductionRankings() {
  return (
    <FilterProvider>
      <LandFilterDrawer />
      <ProductionRankingsContent />
    </FilterProvider>
  );
}
