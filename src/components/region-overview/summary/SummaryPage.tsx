"use client";

import PlayerTopTenTile from "@/components/region-overview/summary/PlayerTopTenTile";
import RegionSummaryStats from "@/components/region-overview/summary/RegionSummaryStats";
import WorksiteTypeTile from "@/components/region-overview/summary/WorksiteTypeTile";
import { getRegionSummary } from "@/lib/backend/actions/region/summary-actions";
import { useFilters } from "@/lib/frontend/context/FilterContext";
import { RegionSummary } from "@/types/regionSummary";
import { Box, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import BoostTile from "./BoostTile";
import DeedRarityTile from "./DeedRarityTile";
import DeedStatusTile from "./DeedStatusTile";
import DeedTypeTile from "./DeedTypeTile";
import LandCardTile from "./LandCardTile";

export default function SummaryPage() {
  const [summary, setSummary] = useState<RegionSummary | null>(null);
  const { filters } = useFilters();

  useEffect(() => {
    if (!filters) return;

    (async () => {
      try {
        const data = await getRegionSummary(filters);
        setSummary(data);
      } catch (error) {
        console.error(error);
      }
    })();
  }, [filters]);

  return (
    <>
      {summary ? (
        <>
          <Box>
            <Box mb={2}>
              <PlayerTopTenTile players={summary.players} />
            </Box>
            <RegionSummaryStats
              deedsCount={summary.deedsCount}
              totalDecNeeded={summary.totalDecNeeded}
              totalDecInUse={summary.totalDecInUse}
              totalDecStaked={summary.totalDecStaked}
              runiCount={summary.runiCount}
            />
          </Box>
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

            <LandCardTile summary={summary} />
          </Stack>
        </>
      ) : (
        <Typography variant="body2" color="text.secondary" align="center">
          Loading worksite data...
        </Typography>
      )}
    </>
  );
}
