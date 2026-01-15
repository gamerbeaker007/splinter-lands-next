"use client";

import PageNavTabs from "@/components/nav-tabs/PageNavTabs";
import PlayerInput from "@/components/player-overview/PlayerInput";
import { getPlayerEfficiency } from "@/lib/backend/actions/efficiency-actions";
import { usePageTitle } from "@/lib/frontend/context/PageTitleContext";
import { PlayerProductionSummaryEnriched } from "@/types/PlayerProductionSummaryEnriched";
import { Box, Container } from "@mui/material";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

type PlayerEfficiencyContextType = {
  playerProductionSummaryData: PlayerProductionSummaryEnriched[] | null;
};

const PlayerEfficiencyContext =
  createContext<PlayerEfficiencyContextType | null>(null);

export function usePlayerEfficiency() {
  const context = useContext(PlayerEfficiencyContext);
  if (!context) {
    throw new Error(
      "usePlayerEfficiency must be used within PlayerEfficiencyLayout"
    );
  }
  return context;
}

const pages = [
  { key: "rankings", label: "Rankings", path: "/player-efficiency/rankings" },
  { key: "dec", label: "DEC", path: "/player-efficiency/dec" },
  { key: "lde", label: "LDE", path: "/player-efficiency/lde" },
  { key: "lce", label: "LCE", path: "/player-efficiency/lce" },
  { key: "lpe", label: "LPE", path: "/player-efficiency/lpe" },
];

type PlayerEfficiencyLayoutProps = {
  children: ReactNode;
};

export default function PlayerEfficiencyLayout({
  children,
}: PlayerEfficiencyLayoutProps) {
  usePageTitle("Player Efficiency");

  const [playerProductionSummaryData, setPlayerProductionSummaryData] =
    useState<PlayerProductionSummaryEnriched[] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getPlayerEfficiency();
        setPlayerProductionSummaryData(data);
      } catch (error) {
        console.error(error);
      }
    })();
  }, []);

  return (
    <PlayerEfficiencyContext.Provider value={{ playerProductionSummaryData }}>
      <PageNavTabs pages={pages} />
      <Container maxWidth={false} sx={{ px: { xs: 2, md: 6, lg: 12 } }}>
        <Box mt={2}>
          <PlayerInput />
        </Box>
        <Box mt={4}>{children}</Box>
      </Container>
    </PlayerEfficiencyContext.Provider>
  );
}
