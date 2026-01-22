"use client";

import DECPage from "@/components/player-efficiency/DECPage";
import { usePlayer } from "@/lib/frontend/context/PlayerContext";
import {
  PlayerEfficiencyProvider,
  usePlayerEfficiency,
} from "../PlayerEfficiencyProvider";

function DECContent() {
  const { selectedPlayer } = usePlayer();
  const { playerProductionSummaryData } = usePlayerEfficiency();

  return (
    <DECPage
      playerSummaryData={playerProductionSummaryData}
      currentPlayer={selectedPlayer}
    />
  );
}

export default function DEC() {
  return (
    <PlayerEfficiencyProvider>
      <DECContent />
    </PlayerEfficiencyProvider>
  );
}
