"use client";

import LDEPage from "@/components/player-efficiency/LDEPage";
import { usePlayerEfficiency } from "../layout";
import { usePlayer } from "@/lib/frontend/context/PlayerContext";

export default function LDE() {
  const { selectedPlayer } = usePlayer();
  const { playerProductionSummaryData } = usePlayerEfficiency();

  return (
    <LDEPage
      playerSummaryData={playerProductionSummaryData}
      currentPlayer={selectedPlayer}
    />
  );
}
