"use client";

import WorksiteTypeTile from "@/components/region-overview/summary/WorksiteTypeTile";
import { useFilters } from "@/lib/context/FilterContext";
import { RegionSummary } from "@/types/regionSummary";
import { Box, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import DeedRarityTile from "./DeedRarityTile";
import DeedTypeTile from "./DeedTypeTile";
import WorksiteBoostTile from "./WorksiteTitleBoostTile";

export default function SummaryPage() {
  const [summary, setSummary] = useState<RegionSummary | null>(null);
  const { filters } = useFilters();

  useEffect(() => {
    if (!filters) return;

    fetch("/api/deed/summary", {
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
    <Box px={{ xs: 2, sm: 4, md: 6 }} py={2} maxWidth="1000px" mx="auto">
      {summary ? (
        <Stack spacing={3}>
          <WorksiteTypeTile data={summary.worksites ?? {}} />
          <DeedTypeTile data={summary.deedTypes ?? {}} />
          <DeedRarityTile data={summary.rarities ?? {}} />
          <WorksiteBoostTile
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
