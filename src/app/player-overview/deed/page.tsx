"use client";

import FilterDrawer from "@/components/filter/FilterDrawer";
import DeedOverview from "@/components/player-overview/deed-overview/DeedOverview";
import { usePlayer } from "@/lib/frontend/context/PlayerContext";
import { Box, CircularProgress } from "@mui/material";
import { Suspense } from "react";

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
      <Suspense
        fallback={
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <CircularProgress />
          </Box>
        }
      >
        <DeedOverview />
      </Suspense>
    </>
  );
}
