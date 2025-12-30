"use client";

import PlayerInput from "@/components/player-overview/PlayerInput";
import { useCardDetailsAction } from "@/hooks/useCardDetails";
import { usePlaygroundData } from "@/hooks/usePlaygroundData";
import { usePageTitle } from "@/lib/frontend/context/PageTitleContext";
import { usePlayer } from "@/lib/frontend/context/PlayerContext";
import { WarningAmber } from "@mui/icons-material";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useEffect } from "react";
import PlaygroundDeedGrid from "./PlaygroundDeedGrid";

export default function PlaygroundPageContent() {
  const { setTitle } = usePageTitle();
  const { selectedPlayer } = usePlayer();
  const { data, loading, error } = usePlaygroundData(selectedPlayer);
  const {
    cardDetails,
    loading: loadingCards,
    error: cardsError,
  } = useCardDetailsAction();

  useEffect(() => {
    setTitle("Land Playground");
  }, [setTitle]);

  const isLoading = loading || loadingCards;
  const hasError = error || cardsError;

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (hasError) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6" color="error">
          {hasError}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        <WarningAmber sx={{ verticalAlign: "middle", mr: 1 }} />
        THIS IS AN EXPERIMENTAL FEATURE
        <WarningAmber sx={{ verticalAlign: "middle", ml: 1 }} />
      </Typography>
      <PlayerInput />

      {!selectedPlayer ? (
        <Typography mt={2} variant="h6" color="text.secondary">
          Please enter a username to view playground data
        </Typography>
      ) : data && cardDetails ? (
        <PlaygroundDeedGrid
          deeds={data.deeds}
          cards={data.cards}
          cardDetails={cardDetails}
          playerName={selectedPlayer}
        />
      ) : null}
    </Box>
  );
}
