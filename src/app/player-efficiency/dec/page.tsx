"use client";

import DECPage from "@/components/player-efficiency/DECPage";
import { usePlayerEfficiency } from "../layout";
import { usePlayer } from "@/lib/frontend/context/PlayerContext";

export default function DEC() {
  const { selectedPlayer } = usePlayer();
  const { playerProductionSummaryData } = usePlayerEfficiency();

  return (
    <DECPage
      playerSummaryData={playerProductionSummaryData}
      currentPlayer={selectedPlayer}
    />
  );
}
