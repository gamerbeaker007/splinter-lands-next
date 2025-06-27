"use client";

import PlayerPageInner from "@/components/player-overview/PlayerPageInner";
import { FilterProvider } from "@/lib/frontend/context/FilterContext";

export default function PlayerPage() {
  return (
    <FilterProvider>
      <PlayerPageInner />
    </FilterProvider>
  );
}
