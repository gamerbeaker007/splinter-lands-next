"use client";

import RankingPage from "@/components/player-efficiency/RankingPage";
import { usePlayer } from "@/lib/frontend/context/PlayerContext";
import {
  PlayerEfficiencyProvider,
  usePlayerEfficiency,
} from "../PlayerEfficiencyProvider";

function RankingsContent() {
  const { selectedPlayer } = usePlayer();
  const { playerProductionSummaryData } = usePlayerEfficiency();

  return (
    <RankingPage
      playerSummaryData={playerProductionSummaryData}
      currentPlayer={selectedPlayer}
    />
  );
}

export default function Rankings() {
  return (
    <PlayerEfficiencyProvider>
      <RankingsContent />
    </PlayerEfficiencyProvider>
  );
}
