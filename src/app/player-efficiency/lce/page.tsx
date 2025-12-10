"use client";

import LCEPage from "@/components/player-efficiency/LCEPage";
import { usePlayerEfficiency } from "../layout";

export default function LCE() {
  const { playerProductionSummaryData, selectedPlayer } = usePlayerEfficiency();

  return (
    <LCEPage
      playerSummaryData={playerProductionSummaryData}
      currentPlayer={selectedPlayer}
    />
  );
}
