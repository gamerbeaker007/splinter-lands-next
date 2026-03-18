"use client";

import PlayerInput from "@/components/player-overview/PlayerInput";
import { usePlaygroundData } from "@/hooks/usePlaygroundData";
import { usePageTitle } from "@/lib/frontend/context/PageTitleContext";
import { usePlayer } from "@/lib/frontend/context/PlayerContext";
import { RegionTax } from "@/types/regionTax";
import { SplCardDetails } from "@/types/splCardDetails";
import { Alert, Box, CircularProgress, Stack, Typography } from "@mui/material";
import PlaygroundDeedGrid from "./PlaygroundDeedGrid";

interface PlaygroundPageContentProps {
  cardDetails: SplCardDetails[];
  regionTax: RegionTax[];
  spsRatio: number;
}

export default function PlaygroundPageContent({
  cardDetails,
  regionTax,
  spsRatio,
}: PlaygroundPageContentProps) {
  usePageTitle("Land Playground");
  const { selectedPlayer } = usePlayer();
  const { data, loading, error } = usePlaygroundData(selectedPlayer);

  if (loading) {
    return (
      <Stack spacing={2} sx={{ p: 4 }} alignItems="center">
        <Alert severity="warning" sx={{ width: "100%", maxWidth: 600 }}>
          Loading all player data — this includes deeds, cards, and staking
          details and may take a while.
        </Alert>
        <CircularProgress />
      </Stack>
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

  return (
    <Box sx={{ p: 2 }}>
      <PlayerInput />

      {!selectedPlayer ? (
        <Typography mt={2} variant="h6" color="text.secondary">
          Please enter a username to view playground data
        </Typography>
      ) : data && cardDetails ? (
        <PlaygroundDeedGrid
          deeds={data.deeds}
          cards={data.cards}
          playerName={selectedPlayer}
          cardDetails={cardDetails}
          regionTax={regionTax}
          spsRatio={spsRatio}
        />
      ) : null}
    </Box>
  );
}
