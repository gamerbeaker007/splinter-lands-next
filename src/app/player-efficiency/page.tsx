"use client";

import { Box, Container } from "@mui/material";
import NavTabs from "@/components/nav-tabs/NavTabs";
import { Page } from "@/types/Page";
import { usePageTitle } from "@/lib/frontend/context/PageTitleContext";
import { useEffect, useState } from "react";
import PlayerInput from "@/components/player-overview/PlayerInput";
import { PlayerProductionSummaryEnriched } from "@/types/PlayerProductionSummaryEnriched";
import RankingPage from "@/components/player-efficiency/RankingPage";

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
  ];

  return (
    <Container maxWidth={false} sx={{ px: { xs: 2, md: 6, lg: 12 } }}>
      <NavTabs
        pages={pages}
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
      />

      <Box mt={2}>
        <PlayerInput onPlayerChange={setSelectedPlayer} />
      </Box>

      <Box mt={4}>{pages[activeTab].component}</Box>
    </Container>
  );
}
