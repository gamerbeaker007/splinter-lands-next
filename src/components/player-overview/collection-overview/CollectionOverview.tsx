"use client";

import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import { usePlayerCardAlerts } from "@/hooks/usePlayerCardAlerts";
import { usePlayerCardPP } from "@/hooks/usePlayerCardPP";
import CardFilterDrawer from "@/components/cardFilter/CardFilterDrawer";
import { useCardFilters } from "@/lib/frontend/context/CardFilterContext";

type Props = { player: string };

export default function CollectionOverview({ player }: Props) {
  const { cardAlerts, loading, error } = usePlayerCardAlerts(player, false);
  const { cardFilters } = useCardFilters();

  const {
    cardPPResult,
    loading: loadingCardPP,
    error: errorCardPP,
  } = usePlayerCardPP(player, false, cardFilters);

  if (loading || loadingCardPP) {
    return (
      <Container maxWidth={false} sx={{ px: { xs: 2, md: 6, lg: 12 } }}>
        <Stack
          spacing={3}
          alignItems="center"
          justifyContent="center"
          minHeight="40vh"
        >
          <CircularProgress />
          <Typography variant="body2" color="text.secondary">
            Loading data (player collection)…
          </Typography>
        </Stack>
      </Container>
    );
  }

  if (error || errorCardPP) {
    return (
      <Container maxWidth={false} sx={{ px: { xs: 2, md: 6, lg: 12 } }}>
        <Stack spacing={3}>
          <Alert severity="error">
            Failed to load player collection: {error}
          </Alert>
        </Stack>
      </Container>
    );
  }

  return (
    <>
      <CardFilterDrawer />
      <Box
        component="pre"
        sx={{
          m: 0,
          p: 2,
          bgcolor: "background.default",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
          overflow: "auto",
          maxHeight: 480,
        }}
      >
        {cardAlerts && (
          <Box>
            <Typography>Not enough workers assigned</Typography>
            {cardAlerts.assignedWorkersAlerts.map((alert, idx) => (
              <Box key={idx}>
                {alert.assignedCards} / 5 PLOTID: {alert.deedInfo.plotId}
              </Box>
            ))}

            <Typography>No Workers assigned</Typography>
            {cardAlerts.noWorkersAlerts.map((alert, idx) => (
              <Box key={idx}>PLOTID: {alert.plotId}</Box>
            ))}

            <Typography>NEGATIVE BOOSTS</Typography>
            {cardAlerts.terrainBoostAlerts.negative.map((alert, idx) => (
              <Box key={idx}>
                {alert.cardDetailId} - Boost: {alert.terrainBoost * 100}% -
                PLOTID: {alert.deedInfo.plotId}
              </Box>
            ))}

            <Typography>ZERO NON NEUTRAL</Typography>
            {cardAlerts.terrainBoostAlerts.zeroNonNeutral.map((alert, idx) => (
              <Box key={idx}>
                {alert.cardDetailId} - Boost: {alert.terrainBoost * 100}% -
                PLOTID: {alert.deedInfo.plotId}
              </Box>
            ))}

            <Typography>ZERO NEUTRAL BOOSTS</Typography>
            {cardAlerts.terrainBoostAlerts.zeroNeutral.map((alert, idx) => (
              <Box key={idx}>
                {alert.cardDetailId} - Boost: {alert.terrainBoost * 100}% -
                PLOTID: {alert.deedInfo.plotId}
              </Box>
            ))}
          </Box>
        )}

        {cardPPResult && (
          <Box>
            <Typography>TOP 100 Base PP</Typography>
            {cardPPResult.top100BasePP.map((card, idx) => (
              <Box key={idx}>
                {card.card_detail_id} - BASE PP: {card.base_pp}
              </Box>
            ))}
            <Typography>TOP 100 RATIO</Typography>
            {cardPPResult.top100PPRatio.map((card, idx) => (
              <Box key={idx}>
                {card.card_detail_id} - RATIO (PP/DEC) {card.ratio}
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </>
  );
}
