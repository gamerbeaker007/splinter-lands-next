"use client";

import PlayerDashboardPage from "@/components/player-overview/player-dashboard/PlayerDashboardPage";
import { usePlayerOverview } from "../layout";

export default function Dashboard() {
  const { selectedPlayer } = usePlayerOverview();

  return <PlayerDashboardPage player={selectedPlayer} />;
}
