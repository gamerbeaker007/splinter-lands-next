"use client";

import FilterDrawer from "@/components/filter/FilterDrawer";
import PlayerRegionOverview from "@/components/player-overview/region-overview/PlayerRegionOverview";
import { usePlayerOverview } from "../layout";

const filterOptions = {
  regions: true,
  tracts: true,
  plots: true,
  attributes: true,
  player: false,
  sorting: false,
};

export default function Overview() {
  const { selectedPlayer } = usePlayerOverview();

  return (
    <>
      <FilterDrawer player={selectedPlayer} filtersEnabled={filterOptions} />
      <PlayerRegionOverview player={selectedPlayer} />
    </>
  );
}
