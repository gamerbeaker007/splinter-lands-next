"use client";

import LPEPage from "@/components/player-efficiency/LPEPage";
import { usePlayer } from "@/lib/frontend/context/PlayerContext";
import { usePlayerEfficiency } from "../layout";

export default function LPE() {
  const { selectedPlayer } = usePlayer();
  const { playerProductionSummaryData } = usePlayerEfficiency();

  return (
    <LPEPage
      playerSummaryData={playerProductionSummaryData}
      currentPlayer={selectedPlayer}
    />
  );
}
