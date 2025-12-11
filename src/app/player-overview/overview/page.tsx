"use client";

import FilterDrawer from "@/components/filter/FilterDrawer";
import PlayerRegionOverview from "@/components/player-overview/region-overview/PlayerRegionOverview";
import { usePlayer } from "@/lib/frontend/context/PlayerContext";

const filterConfig = {
  regions: true,
  tracts: true,
  plots: true,
  attributes: true,
  player: false,
  sorting: false,
};

export default function PlayerOverviewPage() {
  const { selectedPlayer } = usePlayer();

  return (
    <>
      <FilterDrawer player={selectedPlayer} filtersEnabled={filterConfig} />
      <PlayerRegionOverview />
    </>
  );
}
