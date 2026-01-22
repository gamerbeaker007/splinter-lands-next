"use client";

import FilterDrawer from "@/components/filter/FilterDrawer";
import { ProductionRankingsContent } from "@/components/player-efficiency/ProductionRankingsContent";
import { FilterProvider } from "@/lib/frontend/context/FilterContext";

export default function ProductionRankings() {
  return (
    <FilterProvider>
      <FilterDrawer />
      <ProductionRankingsContent />
    </FilterProvider>
  );
}
