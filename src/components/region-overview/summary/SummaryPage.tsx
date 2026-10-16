"use client";

import LandCardVericoTile from "@/components/region-overview/summary/LandCardVericoTile";
import PlayerTopTenTile from "@/components/region-overview/summary/PlayerTopTenTile";
import RegionSummaryStats from "@/components/region-overview/summary/RegionSummaryStats";
import WorksiteTypeTile from "@/components/region-overview/summary/WorksiteTypeTile";
import { useAsyncData } from "@/hooks/useAsyncData";
import { getLandCardCollectionData } from "@/lib/backend/actions/region/land-card-collection-actions";
import { getRegionSummary } from "@/lib/backend/actions/region/summary-actions";
import { useFilters } from "@/lib/frontend/context/FilterContext";
import { Box, Stack, Typography } from "@mui/material";
import BoostTile from "./BoostTile";
import DeedRarityTile from "./DeedRarityTile";
import DeedStatusTile from "./DeedStatusTile";
import DeedTypeTile from "./DeedTypeTile";
import LandCardTile from "./LandCardTile";

export default function SummaryPage() {
  const { filters } = useFilters();

  const { data } = useAsyncData(
    filters ? JSON.stringify(filters) : null,
    async () => {
      const summary = await getRegionSummary(filters!);
      const landCardData = await getLandCardCollectionData({
        filter_players: filters!.filter_players ?? [],
      });
      return { summary, landCardData };
    },
    { errorMessage: "Failed to load region summary" }
  );
  const summary = data?.summary ?? null;
  const landCardData = data?.landCardData ?? null;

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
              totalDecSaved={summary.totalDecSaved}
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
            {landCardData && <LandCardVericoTile summary={landCardData} />}
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
