import { useFilters } from "@/lib/frontend/context/FilterContext";
import { usePageTitle } from "@/lib/frontend/context/PageTitleContext";
import { SplPlayerDetails } from "@/types/splPlayerDetails";
import { Box, Alert, Container } from "@mui/material";
import { useState, useRef, useEffect } from "react";
import FilterDrawer from "../filter/FilterDrawer";
import NavTabs from "../nav-tabs/NavTabs";
import DeedOverview from "./DeedOverview";
import PlayerInput from "./PlayerInput";
import PlayerRegionOverview from "./region-overview/PlayerRegionOverview";
import { EnableFilterOptions } from "@/types/filters";
import { Page } from "@/types/Page";

const defaultFilterConfig: EnableFilterOptions = {
  regions: true,
  tracts: true,
  plots: true,
  attributes: true,
  player: false,
  sorting: false,
};

const defaultWithSortingFilterConfig: EnableFilterOptions = {
  regions: true,
  tracts: true,
  plots: true,
  attributes: true,
  player: false,
  sorting: true,
};

export default function PlayerPageInner() {
  const { setTitle } = usePageTitle();
  const { resetFilters } = useFilters();
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [playerData, setPlayerData] = useState<SplPlayerDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);
  const prevPlayer = useRef<string | null>(null);

  useEffect(() => {
    setTitle("Player Overview");
  }, [setTitle]);

  useEffect(() => {
    if (selectedPlayer && selectedPlayer !== prevPlayer.current) {
      resetFilters();
      prevPlayer.current = selectedPlayer;
    }
  }, [selectedPlayer, resetFilters]);

  useEffect(() => {
    if (!selectedPlayer || selectedPlayer.trim() === "") {
      setPlayerData(null);
      setError(null);
      return;
    }

    fetch(`/api/player/details?player=${encodeURIComponent(selectedPlayer)}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok || json?.error) {
          throw new Error(json?.error || "Unknown error");
        }
        setPlayerData(json);
        setError(null);
      })
      .catch(() => {
        setPlayerData(null);
        setError(`Unable to find player: ${selectedPlayer}`);
      });
  }, [selectedPlayer]);

  const pages: Page[] = [
    {
      label: "Region Overview",
      component: <PlayerRegionOverview player={selectedPlayer} />,
      filterOptions: defaultFilterConfig,
    },
    {
      label: "Deed",
      component: <DeedOverview player={selectedPlayer} />,
      filterOptions: defaultWithSortingFilterConfig,
    },
  ];

  const activePage = pages[activeTab];
  return (
    <>
      <NavTabs
        pages={pages}
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
      />
      <Container maxWidth={false} sx={{ px: { xs: 2, md: 6, lg: 12 } }}>
        <Box mt={2}>
          <PlayerInput onPlayerChange={setSelectedPlayer} />
        </Box>

        {error && (
          <Box mt={4}>
            <Alert severity="warning">{error}</Alert>
          </Box>
        )}

        {!error && playerData && selectedPlayer && (
          <>
            <FilterDrawer
              player={selectedPlayer}
              filtersEnabled={activePage.filterOptions}
            />
            <Box mt={4} mb={4}>
              {activePage.component}
            </Box>
          </>
        )}
      </Container>
    </>
  );
}
