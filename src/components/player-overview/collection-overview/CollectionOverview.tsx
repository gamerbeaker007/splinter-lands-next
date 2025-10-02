"use client";

import CardFilterDrawer from "@/components/cardFilter/CardFilterDrawer";
import ErrorComponent from "@/components/ui/ErrorComponent";
import LoadingComponent from "@/components/ui/LoadingComponent";
import { usePlayerCardPP } from "@/hooks/protected/usePlayerCardPP";
import { useCardFilters } from "@/lib/frontend/context/CardFilterContext";
import { useAuth } from "@/lib/frontend/context/AuthContext";
import { Refresh } from "@mui/icons-material";
import { Box, Button, Typography } from "@mui/material";
import CardTable from "./CardTable";

type Props = { player: string };

export default function CollectionOverview({ player }: Props) {
  const { user } = useAuth();
  const { cardFilters } = useCardFilters();

  const { cardPPResult, loading, error, refetchPlayerCardPP } = usePlayerCardPP(
    player,
    cardFilters,
  );

  function refetchData() {
    refetchPlayerCardPP(true); // Pass force as true to refetch data
  }

  if (loading) {
    return <LoadingComponent title={"Loading data (player collection)…"} />;
  }

  if (error) {
    return (
      <ErrorComponent title={`Failed to load player collection: ${error}`} />
    );
  }

  const isAuthenticated = user?.username === player;

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

      {cardPPResult && (
        <CardTable
          data={cardPPResult}
          isAuthenticated={isAuthenticated}
          pageSize={100}
        />
      )}
    </Box>
  );
}
