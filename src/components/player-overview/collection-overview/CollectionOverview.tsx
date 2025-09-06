"use client";

import CardFilterDrawer from "@/components/cardFilter/CardFilterDrawer";
import { usePlayerCardPP } from "@/hooks/usePlayerCardPP";
import { useCardFilters } from "@/lib/frontend/context/CardFilterContext";
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import BasePPSection from "./BasePPSection";

type Props = { player: string };

export default function CollectionOverview({ player }: Props) {
  const { cardFilters } = useCardFilters();

  const { cardPPResult, loading, error } = usePlayerCardPP(
    player,
    false,
    cardFilters,
  );

  if (loading) {
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

  if (error) {
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
        }}
      >
        {cardPPResult && (
          <Box>
            <BasePPSection basePPList={cardPPResult.basePPList} />

            <Typography>TOP 100 RATIO</Typography>
            {cardPPResult.ratioPPList.map((card, idx) => (
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
