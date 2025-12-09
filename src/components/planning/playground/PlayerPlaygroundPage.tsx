"use client";

import PlayerInput from "@/components/player-overview/PlayerInput";
import {
  getPlayerCollection,
  getPlayerDeeds,
} from "@/lib/backend/actions/playerPlanning";
import { RawRegionDataResponse } from "@/types/RawRegionDataResponse";
import { SplPlayerCardCollection } from "@/types/splPlayerCardDetails";
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

export default function PlayerPlaygroundPage() {
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [playerCollection, setPlayerCollection] = useState<
    SplPlayerCardCollection[] | null
  >(null);
  const [playerDeeds, setPlayerDeeds] = useState<RawRegionDataResponse | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedPlayer) {
      setPlayerCollection(null);
      setPlayerDeeds(null);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [collection, deeds] = await Promise.all([
          getPlayerCollection(selectedPlayer),
          getPlayerDeeds(selectedPlayer),
        ]);
        setPlayerCollection(collection);
        setPlayerDeeds(deeds);
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error ? err.message : "Failed to load player data"
        );
        setPlayerCollection(null);
        setPlayerDeeds(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedPlayer]);

  return (
    <Container maxWidth={false} sx={{ px: { xs: 2, md: 6, lg: 12 } }}>
      <Stack spacing={3} mt={2}>
        <Box>
          <PlayerInput onPlayerChange={setSelectedPlayer} />
        </Box>

        {loading && (
          <Stack
            spacing={3}
            alignItems="center"
            justifyContent="center"
            minHeight="40vh"
          >
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">
              Loading player data…
            </Typography>
          </Stack>
        )}

        {error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && playerCollection && playerDeeds && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Player: {selectedPlayer}
            </Typography>
            <Typography variant="body1">
              Cards: {playerCollection.length}
            </Typography>
            <Typography variant="body1">
              Deeds: {playerDeeds.deeds?.length || 0}
            </Typography>
            {/* TODO: Add more detailed UI for player collection and deeds */}
          </Box>
        )}

        {!loading && !error && !selectedPlayer && (
          <Box textAlign="center" py={8}>
            <Typography variant="body1" color="text.secondary">
              Enter a player name to view their collection and deeds
            </Typography>
          </Box>
        )}
      </Stack>
    </Container>
  );
}
