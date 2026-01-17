"use client";

import PlayerInput from "@/components/player-overview/PlayerInput";
import { usePlaygroundData } from "@/hooks/usePlaygroundData";
import { usePageTitle } from "@/lib/frontend/context/PageTitleContext";
import { usePlayer } from "@/lib/frontend/context/PlayerContext";
import { RegionTax } from "@/types/regionTax";
import { SplCardDetails } from "@/types/splCardDetails";
import { Box, CircularProgress, Typography } from "@mui/material";
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
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
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
