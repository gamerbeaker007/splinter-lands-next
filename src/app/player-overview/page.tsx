"use client";

import PlayerPageInner from "@/components/player-overview/PlayerPageInner";
import { FilterProvider } from "@/lib/frontend/context/FilterContext";
import { CardFilterProvider } from "@/lib/frontend/context/CardFilterContext";

export default function PlayerPage() {
  return (
    <FilterProvider>
      <CardFilterProvider>
        <PlayerPageInner />
      </CardFilterProvider>
    </FilterProvider>
  );
}
