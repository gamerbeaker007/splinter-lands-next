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
import { Box, Container } from "@mui/material";
import { ReactNode, useEffect } from "react";

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
  {
    key: "deed-history",
    label: "Deed History",
    path: "/player-overview/deed-history",
  },
];

type PlayerOverviewLayoutProps = {
  children: ReactNode;
};

function PlayerOverviewLayoutInner({ children }: PlayerOverviewLayoutProps) {
  usePageTitle("Player Overview");
  const { resetFilters } = useFilters();
  const { selectedPlayer } = usePlayer();

  useEffect(() => {
    if (selectedPlayer) {
      resetFilters();
    }
  }, [selectedPlayer, resetFilters]);

  return (
    <>
      <PageNavTabs pages={pages} />
      <Container maxWidth={false} sx={{ px: { xs: 2, md: 6, lg: 12 } }}>
        <Box mt={2}>
          <PlayerInput />
        </Box>

        <Box mt={4} mb={4}>
          {children}
        </Box>
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
