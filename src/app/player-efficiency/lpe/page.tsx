"use client";

import LPEPage from "@/components/player-efficiency/LPEPage";
import { usePlayer } from "@/lib/frontend/context/PlayerContext";
import {
  PlayerEfficiencyProvider,
  usePlayerEfficiency,
} from "../PlayerEfficiencyProvider";

function LPEContent() {
  const { selectedPlayer } = usePlayer();
  const { playerProductionSummaryData } = usePlayerEfficiency();

  return (
    <LPEPage
      playerSummaryData={playerProductionSummaryData}
      currentPlayer={selectedPlayer}
    />
  );
}

export default function LPE() {
  return (
    <PlayerEfficiencyProvider>
      <LPEContent />
    </PlayerEfficiencyProvider>
  );
}
