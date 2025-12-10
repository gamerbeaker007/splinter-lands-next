"use client";

import DECPage from "@/components/player-efficiency/DECPage";
import { usePlayerEfficiency } from "../layout";

export default function DEC() {
  const { playerProductionSummaryData, selectedPlayer } = usePlayerEfficiency();

  return (
    <DECPage
      playerSummaryData={playerProductionSummaryData}
      currentPlayer={selectedPlayer}
    />
  );
}
