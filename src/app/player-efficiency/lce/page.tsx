"use client";

import LCEPage from "@/components/player-efficiency/LCEPage";
import { usePlayerEfficiency } from "../layout";
import { usePlayer } from "@/lib/frontend/context/PlayerContext";

export default function LCE() {
  const { selectedPlayer } = usePlayer();
  const { playerProductionSummaryData } = usePlayerEfficiency();

  return (
    <LCEPage
      playerSummaryData={playerProductionSummaryData}
      currentPlayer={selectedPlayer}
    />
  );
}
