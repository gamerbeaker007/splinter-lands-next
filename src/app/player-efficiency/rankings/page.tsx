"use client";

import RankingPage from "@/components/player-efficiency/RankingPage";
import { usePlayer } from "@/lib/frontend/context/PlayerContext";
import { usePlayerEfficiency } from "../layout";

export default function Rankings() {
  const { selectedPlayer } = usePlayer();
  const { playerProductionSummaryData } = usePlayerEfficiency();

  return (
    <RankingPage
      playerSummaryData={playerProductionSummaryData}
      currentPlayer={selectedPlayer}
    />
  );
}
