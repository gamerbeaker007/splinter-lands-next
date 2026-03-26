"use client";

import { CardCollectionTable } from "@/components/region-overview/cards/CardCollectionTable";
import { CardSetOverviewChart } from "@/components/region-overview/cards/CardSetOverviewChart";
import { CardSetPpPieChart } from "@/components/region-overview/cards/CardSetPpPieChart";
import { CardsByRarityChart } from "@/components/region-overview/cards/CardsByRarityChart";
import WeeklyDataAlert from "@/components/ui/WeeklyDataAlert";
import {
  getLandCardCollectionData,
  LandCardCollectionResult,
} from "@/lib/backend/actions/region/land-card-collection-actions";
import { useFilters } from "@/lib/frontend/context/FilterContext";
import { Alert, Box, Paper, Skeleton, Typography } from "@mui/material";
import { useEffect, useState, useTransition } from "react";

export function CardCollectionPage() {
  const [data, setData] = useState<LandCardCollectionResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const { filters } = useFilters();

  useEffect(() => {
    if (!filters) return;

    startTransition(async () => {
      try {
        const result = await getLandCardCollectionData({
          filter_players: filters.filter_players ?? [],
        });
        setData(result);
      } catch (error) {
        console.error("Failed to load card collection data:", error);
      }
    });
  }, [filters]);

  if (isPending && !data) {
    return (
      <Box sx={{ p: 2 }}>
        <Skeleton variant="rectangular" width="100%" height={400} />
      </Box>
    );
  }

  if (!data || data.editionSummary.length === 0) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="info">
          No card collection data available yet. This data is computed during
          the weekly scan.
        </Alert>
      </Box>
    );
  }

  const totalCards = data.editionSummary.reduce(
    (sum, r) => sum + r.total_cards,
    0
  );

  return (
    <Box sx={{ mt: 2 }}>
      <WeeklyDataAlert
        lastUpdated={data.lastUpdated}
        label="Card collection data"
      />

      <Box display="flex" gap={2} mb={2} flexWrap="wrap">
        <Paper sx={{ p: 2, borderRadius: 2, minWidth: 140 }}>
          <Typography variant="caption" color="text.secondary">
            Total Cards on Land
          </Typography>
          <Typography variant="h6" fontWeight="bold">
            {totalCards.toLocaleString()}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, borderRadius: 2, minWidth: 140 }}>
          <Typography variant="caption" color="text.secondary">
            Card sets tracked
          </Typography>
          <Typography variant="h6" fontWeight="bold">
            {data.editionSummary.length}
          </Typography>
        </Paper>
      </Box>

      <CardCollectionTable editionSummary={data.editionSummary} />

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mt: 1, display: "block" }}
      >
        Click the arrow on any row to see a breakdown by rarity and level (hover
        chips for foil breakdown). Only cards actively staked on a land plot are
        included.
      </Typography>

      <Box
        sx={{
          mt: 3,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 2,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <CardsByRarityChart editionSummary={data.editionSummary} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <CardSetPpPieChart editionSummary={data.editionSummary} />
        </Box>
      </Box>

      <Box sx={{ mt: 3 }}>
        <CardSetOverviewChart editionSummary={data.editionSummary} />
      </Box>
    </Box>
  );
}
