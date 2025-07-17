"use client";

import NavTabs from "@/components/nav-tabs/NavTabs";
import LDEPage from "@/components/player-efficiency/LDEPage";
import RankingPage from "@/components/player-efficiency/RankingPage";
import PlayerInput from "@/components/player-overview/PlayerInput";
import { usePageTitle } from "@/lib/frontend/context/PageTitleContext";
import { Page } from "@/types/Page";
import { PlayerProductionSummaryEnriched } from "@/types/PlayerProductionSummaryEnriched";
import { Box, Container } from "@mui/material";
import { useEffect, useState } from "react";
import LCEPage from "@/components/player-efficiency/LCEPage";
import LPEPage from "@/components/player-efficiency/LPEPage";
import DECPage from "@/components/player-efficiency/DECPage";

export default function PlayerPage() {
  const { setTitle } = usePageTitle();
  const [activeTab, setActiveTab] = useState<number>(0);
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [playerProductionSummaryData, setPlayerProductionSummaryData] =
    useState<PlayerProductionSummaryEnriched[] | null>(null);

  useEffect(() => {
    setTitle("Player Efficiency");
  }, [setTitle]);

  useEffect(() => {
    fetch("/api/efficiency", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then(setPlayerProductionSummaryData)
      .catch(console.error);
  }, []);

  const pages: Page[] = [
    {
      label: "Rankings",
      component: (
        <RankingPage
          playerSummaryData={playerProductionSummaryData}
          currentPlayer={selectedPlayer}
        />
      ),
    },
    {
      label: "DEC",
      component: (
        <DECPage
          playerSummaryData={playerProductionSummaryData}
          currentPlayer={selectedPlayer}
        />
      ),
    },
    {
      label: "LDE",
      component: (
        <LDEPage
          playerSummaryData={playerProductionSummaryData}
          currentPlayer={selectedPlayer}
        />
      ),
    },
    {
      label: "LCE",
      component: (
        <LCEPage
          playerSummaryData={playerProductionSummaryData}
          currentPlayer={selectedPlayer}
        />
      ),
    },
    {
      label: "LPE",
      component: (
        <LPEPage
          playerSummaryData={playerProductionSummaryData}
          currentPlayer={selectedPlayer}
        />
      ),
    },
  ];

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

        <Box mt={4}>{pages[activeTab].component}</Box>
      </Container>
    </>
  );
}
