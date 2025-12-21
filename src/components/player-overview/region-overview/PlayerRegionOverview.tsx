"use client";

import RegionCardList from "@/components/player-overview/region-overview/RegionCardList";
import TaxCardList from "@/components/player-overview/region-overview/TaxCardList";
import TotalsCardList from "@/components/player-overview/region-overview/TotalsCardList";
import { usePlayerRegionData } from "@/hooks/action-based/usePlayerRegionData";
import { useFilters } from "@/lib/frontend/context/FilterContext";
import { usePlayer } from "@/lib/frontend/context/PlayerContext";
import { Refresh } from "@mui/icons-material";
import { Box, Button, Typography } from "@mui/material";
import ProductionTotalsDEC from "./ProductionTotalsDEC";
import TaxTotalsDEC from "./TaxTotalsDEC";

export default function PlayerRegionOverview() {
  const { selectedPlayer } = usePlayer();
  const { filters } = useFilters();

  // Use server action hook
  const { data, taxData, loadingText, refetch } = usePlayerRegionData(
    selectedPlayer,
    filters
  );

  return (
    <>
      {loadingText ? (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body1">{loadingText}</Typography>
        </Box>
      ) : (
        <>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => refetch(true)}
          >
            Refresh Data
          </Button>

          <ProductionTotalsDEC totalDec={data?.totals.totalDEC || 0} />
          {taxData ? <TaxTotalsDEC taxData={taxData} /> : null}
          {data ? (
            <>
              <Typography variant="h6" mt={2}>
                🌍 Total Net (All Regions)
              </Typography>
              <TotalsCardList regionTotals={data.totals} />
              <Typography variant="h4" mt={2}>
                Production Overview
              </Typography>
              <RegionCardList data={data.regionSummary} />
            </>
          ) : null}

          {taxData ? (
            <>
              <Typography variant="h4" mt={2}>
                Tax Income:
              </Typography>
              <TaxCardList data={taxData} />
            </>
          ) : null}
        </>
      )}
    </>
  );
}
