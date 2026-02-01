"use client";

import { useEnrichedPlayerDeeds } from "@/hooks/useEnrichedPlayerDeeds";
import { useFilters } from "@/lib/frontend/context/FilterContext";
import { usePlayer } from "@/lib/frontend/context/PlayerContext";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DeedHistoryPage() {
  const router = useRouter();
  const { selectedPlayer } = usePlayer();
  const { filters } = useFilters();
  const { deeds, loadingText } = useEnrichedPlayerDeeds(
    selectedPlayer,
    filters
  );

  useEffect(() => {
    // Redirect to the first deed if available
    if (deeds && deeds.length > 0 && deeds[0].deed_uid) {
      router.replace(`/player-overview/deed-history/${deeds[0].deed_uid}`);
    }
  }, [deeds, router]);

  if (!selectedPlayer) {
    return (
      <Box sx={{ padding: 4, textAlign: "center" }}>
        <Typography variant="h6">
          Please select a player to view deed history
        </Typography>
      </Box>
    );
  }

  if (loadingText) {
    return (
      <Box sx={{ padding: 4, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>{loadingText}</Typography>
      </Box>
    );
  }

  if (!deeds || deeds.length === 0) {
    return (
      <Box sx={{ padding: 4, textAlign: "center" }}>
        <Typography variant="h6">
          No deeds found for player {selectedPlayer}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 4, textAlign: "center" }}>
      <CircularProgress />
      <Typography sx={{ mt: 2 }}>Redirecting to first deed...</Typography>
    </Box>
  );
}
