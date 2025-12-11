"use client";

import PageNavTabs from "@/components/nav-tabs/PageNavTabs";
import PlayerInput from "@/components/player-overview/PlayerInput";
import { CardFilterProvider } from "@/lib/frontend/context/CardFilterContext";
import {
  FilterProvider,
  useFilters,
} from "@/lib/frontend/context/FilterContext";
import { usePageTitle } from "@/lib/frontend/context/PageTitleContext";
import { usePlayer } from "@/lib/frontend/context/PlayerContext";
import { SplPlayerDetails } from "@/types/splPlayerDetails";
import { Alert, Box, Container } from "@mui/material";
import { ReactNode, useEffect, useState } from "react";

const pages = [
  {
    key: "dashboard",
    label: "Player Dashboard",
    path: "/player-overview/dashboard",
  },
  {
    key: "overview",
    label: "Region Overview",
    path: "/player-overview/overview",
  },
  { key: "deed", label: "Deed", path: "/player-overview/deed" },
  {
    key: "collection",
    label: "Collection",
    path: "/player-overview/collection",
  },
];

type PlayerOverviewLayoutProps = {
  children: ReactNode;
};

function PlayerOverviewLayoutInner({ children }: PlayerOverviewLayoutProps) {
  const { setTitle } = usePageTitle();
  const { resetFilters } = useFilters();
  const { selectedPlayer } = usePlayer();
  const [playerData, setPlayerData] = useState<SplPlayerDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle("Player Overview");
  }, [setTitle]);

  useEffect(() => {
    if (selectedPlayer) {
      resetFilters();
    }
  }, [selectedPlayer, resetFilters]);

  // Fetch player data for validation
  useEffect(() => {
    if (!selectedPlayer || selectedPlayer.trim() === "") {
      setPlayerData(null);
      setError(null);
      return;
    }

    const fetchPlayerData = async () => {
      try {
        const res = await fetch(
          `/api/player/details?player=${encodeURIComponent(selectedPlayer)}`
        );
        const json = await res.json();

        if (!res.ok || json?.error) {
          throw new Error(json?.error || "Unknown error");
        }

        setPlayerData(json);
        setError(null);
      } catch (err) {
        setPlayerData(null);
        setError(
          err instanceof Error
            ? err.message
            : `Unable to find player: ${selectedPlayer}`
        );
      }
    };

    fetchPlayerData();
  }, [selectedPlayer]);

  return (
    <>
      <PageNavTabs pages={pages} />
      <Container maxWidth={false} sx={{ px: { xs: 2, md: 6, lg: 12 } }}>
        <Box mt={2}>
          <PlayerInput />
        </Box>

        {error && (
          <Box mt={4}>
            <Alert severity="warning">{error}</Alert>
          </Box>
        )}

        {!error && playerData && selectedPlayer && (
          <Box mt={4} mb={4}>
            {children}
          </Box>
        )}
      </Container>
    </>
  );
}

export default function PlayerOverviewLayout({
  children,
}: PlayerOverviewLayoutProps) {
  return (
    <FilterProvider>
      <CardFilterProvider>
        <PlayerOverviewLayoutInner>{children}</PlayerOverviewLayoutInner>
      </CardFilterProvider>
    </FilterProvider>
  );
}
