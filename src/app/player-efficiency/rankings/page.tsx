"use client";

import RankingPage from "@/components/player-efficiency/RankingPage";
import { usePlayerEfficiency } from "../layout";

export default function Rankings() {
  const { playerProductionSummaryData, selectedPlayer } = usePlayerEfficiency();

  return (
    <RankingPage
      playerSummaryData={playerProductionSummaryData}
      currentPlayer={selectedPlayer}
    />
  );
}
