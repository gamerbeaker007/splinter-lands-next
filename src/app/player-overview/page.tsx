"use client";

import FilterDrawer from "@/components/filter/FilterDrawer";
import NavTabs from "@/components/nav-tabs/NavTabs";
import DeedOverview from "@/components/player-overview/DeedOverview";
import PlayerInput from "@/components/player-overview/PlayerInput";
import PlayerRegionOverview from "@/components/player-overview/region-overview/PlayerRegionOverview";
import { FilterProvider } from "@/lib/frontend/context/FilterContext";
import { usePageTitle } from "@/lib/frontend/context/PageTitleContext";
import { SplPlayerDetails } from "@/types/splPlayerDetails";
import { Alert, Box, Container } from "@mui/material";
import { useEffect, useState } from "react";

export default function PlayerPage() {
  const { setTitle } = usePageTitle();

  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [playerData, setPlayerData] = useState<SplPlayerDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);

  useEffect(() => {
    setTitle("Player Overview");
  }, [setTitle]);

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

  const pages = [
    {
      label: "Region Overview",
      component: <PlayerRegionOverview player={selectedPlayer} />,
    },
    {
      label: "Deed",
      component: <DeedOverview player={selectedPlayer} />,
    },
  ];

  return (
    <FilterProvider>
      <Container maxWidth={false} sx={{ px: { xs: 2, md: 6, lg: 12 } }}>
        <NavTabs
          pages={pages}
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
        />

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
            <FilterDrawer player={selectedPlayer} />

            <Box mt={4}>{pages[activeTab].component}</Box>
          </>
        )}
      </Container>
    </FilterProvider>
  );
}
