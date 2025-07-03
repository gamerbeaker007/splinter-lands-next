"use client";

import WorksiteTypeTile from "@/components/region-overview/summary/WorksiteTypeTile";
import { useFilters } from "@/lib/frontend/context/FilterContext";
import { RegionSummary } from "@/types/regionSummary";
import { Box, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import DeedRarityTile from "./DeedRarityTile";
import DeedTypeTile from "./DeedTypeTile";
import BoostTile from "./BoostTile";
import DeedStatusTile from "./DeedStatusTile";

export default function SummaryPage() {
  const [summary, setSummary] = useState<RegionSummary | null>(null);
  const { filters } = useFilters();

  useEffect(() => {
    if (!filters) return;

    fetch("/api/region/summary", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(filters),
    })
      .then((res) => res.json())
      .then(setSummary)
      .catch(console.error);
  }, [filters]);

  return (
    <Box px={{ xs: 2, sm: 4, md: 6, lg: 0 }} py={2}>
      {summary ? (
        <Stack spacing={3}>
          <WorksiteTypeTile data={summary.worksites ?? {}} />
          <DeedTypeTile data={summary.deedTypes ?? {}} />
          <DeedRarityTile data={summary.rarities ?? {}} />
          <DeedStatusTile data={summary.plotStatuses ?? {}} />
          <BoostTile
            titleBoosts={summary.titleBoosts ?? {}}
            totemBoosts={summary.totemBoosts ?? {}}
            runiBoosts={summary.runiBoosts ?? {}}
            rarityBoosts={summary.deedRarityBoosts ?? {}}
          />
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary" align="center">
          Loading worksite data...
        </Typography>
      )}
    </Box>
  );
}
