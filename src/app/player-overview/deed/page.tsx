"use client";

import FilterDrawer from "@/components/filter/FilterDrawer";
import DeedOverview from "@/components/player-overview/deed-overview/DeedOverview";
import { usePlayer } from "@/lib/frontend/context/PlayerContext";

const filterOptions = {
  regions: true,
  tracts: true,
  plots: true,
  attributes: true,
  player: false,
  sorting: true,
};

export default function Deed() {
  const { selectedPlayer } = usePlayer();

  return (
    <>
      <FilterDrawer player={selectedPlayer} filtersEnabled={filterOptions} />
      <DeedOverview />
    </>
  );
}
