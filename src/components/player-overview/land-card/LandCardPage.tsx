"use client";

import { LandCardResources } from "@/components/player-overview/player-dashboard/LandCardResources";
import { usePlayerDashboard } from "@/hooks/usePlayerDashboard";
import { usePlayer } from "@/lib/frontend/context/PlayerContext";
import { Typography } from "@mui/material";

export default function LandCardPage() {
  const { selectedPlayer } = usePlayer();
  const { playerOverview, loadingText } = usePlayerDashboard(selectedPlayer);

  if (!selectedPlayer) {
    return (
      <Typography variant="body1" sx={{ mt: 2 }}>
        Please enter a username to view land card resources.
      </Typography>
    );
  }

  if (loadingText) {
    return <Typography variant="body1">{loadingText}</Typography>;
  }

  if (!playerOverview) {
    return null;
  }

  return <LandCardResources playerOverview={playerOverview} />;
}
