"use client";

import LPEPage from "@/components/player-efficiency/LPEPage";
import { usePlayerEfficiency } from "../layout";

export default function LPE() {
  const { playerProductionSummaryData, selectedPlayer } = usePlayerEfficiency();

  return (
    <LPEPage
      playerSummaryData={playerProductionSummaryData}
      currentPlayer={selectedPlayer}
    />
  );
}
