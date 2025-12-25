"use client";

import PlayerInput from "@/components/player-overview/PlayerInput";
import { usePlaygroundData } from "@/hooks/usePlaygroundData";
import { getCardDetails } from "@/lib/backend/actions/card-detail-actions";
import { usePageTitle } from "@/lib/frontend/context/PageTitleContext";
import { usePlayer } from "@/lib/frontend/context/PlayerContext";
import { SplCardDetails } from "@/types/splCardDetails";
import { WarningAmber } from "@mui/icons-material";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import PlaygroundDeedGrid from "./PlaygroundDeedGrid";

export default function PlaygroundPageContent() {
  const { setTitle } = usePageTitle();
  const { selectedPlayer } = usePlayer();
  const { data, loading, error } = usePlaygroundData(selectedPlayer);

  const [mounted, setMounted] = useState(false);
  const [cardDetails, setCardDetails] = useState<SplCardDetails[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setTitle("Land Playground");
  }, [setTitle]);

  useEffect(() => {
    const loadCards = async () => {
      try {
        const cards = await getCardDetails();
        setCardDetails(cards);
      } catch (err) {
        console.error("Failed to load card details:", err);
      } finally {
        setLoadingCards(false);
      }
    };
    loadCards();
  }, []);

  // Prevent hydration mismatch by showing loading state until mounted
  if (!mounted || loading || loadingCards) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!selectedPlayer) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary">
          Please select a player to view playground data
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6" color="error">
          {error}
        </Typography>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary">
          No data available
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        <WarningAmber sx={{ verticalAlign: "middle", mr: 1 }} />
        THIS IS A EXPERIMENTAL FEATURE USE WITH CAUTION
        <WarningAmber sx={{ verticalAlign: "middle", mr: 1 }} />
      </Typography>
      <PlayerInput />

      {/* DeedGrid handles all deed-related UI and logic */}
      <PlaygroundDeedGrid
        deeds={data.deeds}
        cards={data.cards}
        cardDetails={cardDetails}
        playerName={selectedPlayer}
      />
    </Box>
  );
}
