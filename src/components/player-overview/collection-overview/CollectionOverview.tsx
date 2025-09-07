"use client";

import CardFilterDrawer from "@/components/cardFilter/CardFilterDrawer";
import { usePlayerCardPP } from "@/hooks/usePlayerCardPP";
import { useCardFilters } from "@/lib/frontend/context/CardFilterContext";
import { Refresh } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import CardTable from "./CardTable";

type Props = { player: string };

export default function CollectionOverview({ player }: Props) {
  const { cardFilters } = useCardFilters();

  const { cardPPResult, loading, error, refetchPlayerCardPP } = usePlayerCardPP(
    player,
    cardFilters,
  );

  function refetchData() {
    refetchPlayerCardPP(true); // Pass force as true to refetch data
  }

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

  console.log("cardPPResult", cardPPResult);
  return (
    <Box
      sx={{
        bgcolor: "background.default",
        borderRadius: 1,
        overflow: "auto",
        width: "100%",
        maxWidth: "100vw",
      }}
    >
      <CardFilterDrawer />
      <Button
        size="small"
        variant="outlined"
        startIcon={<Refresh />}
        onClick={refetchData}
        sx={{ mb: 2 }}
      >
        Refresh Data
      </Button>

      <Typography variant="h5" gutterBottom>
        Card Collection
      </Typography>
      <Typography
        variant="body2"
        gutterBottom
        color="text.secondary"
        sx={{ whiteSpace: "pre-line" }}
      >
        {`Note: Cards with 0 Base PP are not included in this list. 
        Note: Cards from special sets like "Soulbound" or "Foundation" or "Extra" are also excluded.`}
      </Typography>

      <Box
        sx={{
          width: "100%",
          maxWidth: { xs: "100vw", md: 1200 },
          overflowX: "auto",
        }}
      >
        {cardPPResult && <CardTable data={cardPPResult} pageSize={100} />}
      </Box>
    </Box>
  );
}
