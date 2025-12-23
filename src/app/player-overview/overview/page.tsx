"use client";

import FilterDrawer from "@/components/filter/FilterDrawer";
import PlayerRegionOverview from "@/components/player-overview/region-overview/PlayerRegionOverview";
import { usePlayer } from "@/lib/frontend/context/PlayerContext";
import { Box, CircularProgress } from "@mui/material";
import { Suspense } from "react";

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
      <Suspense
        fallback={
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <CircularProgress />
          </Box>
        }
      >
        <PlayerRegionOverview />
      </Suspense>
    </>
  );
}
