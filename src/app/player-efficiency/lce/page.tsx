"use client";

import LCEPage from "@/components/player-efficiency/LCEPage";
import { usePlayer } from "@/lib/frontend/context/PlayerContext";
import {
  PlayerEfficiencyProvider,
  usePlayerEfficiency,
} from "../PlayerEfficiencyProvider";

function LCEContent() {
  const { selectedPlayer } = usePlayer();
  const { playerProductionSummaryData } = usePlayerEfficiency();

  return (
    <LCEPage
      playerSummaryData={playerProductionSummaryData}
      currentPlayer={selectedPlayer}
    />
  );
}

export default function LCE() {
  return (
    <PlayerEfficiencyProvider>
      <LCEContent />
    </PlayerEfficiencyProvider>
  );
}
