"use client";

import LDEPage from "@/components/player-efficiency/LDEPage";
import { usePlayerEfficiency } from "../layout";

export default function LDE() {
  const { playerProductionSummaryData, selectedPlayer } = usePlayerEfficiency();

  return (
    <LDEPage
      playerSummaryData={playerProductionSummaryData}
      currentPlayer={selectedPlayer}
    />
  );
}
