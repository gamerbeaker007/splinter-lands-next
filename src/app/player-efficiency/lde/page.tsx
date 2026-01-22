"use client";

import LDEPage from "@/components/player-efficiency/LDEPage";
import { usePlayer } from "@/lib/frontend/context/PlayerContext";
import {
  PlayerEfficiencyProvider,
  usePlayerEfficiency,
} from "../PlayerEfficiencyProvider";

function LDEContent() {
  const { selectedPlayer } = usePlayer();
  const { playerProductionSummaryData } = usePlayerEfficiency();

  return (
    <LDEPage
      playerSummaryData={playerProductionSummaryData}
      currentPlayer={selectedPlayer}
    />
  );
}

export default function LDE() {
  return (
    <PlayerEfficiencyProvider>
      <LDEContent />
    </PlayerEfficiencyProvider>
  );
}
