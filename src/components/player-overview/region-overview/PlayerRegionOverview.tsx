"use client";

import RegionCardList from "@/components/player-overview/region-overview/RegionCardList";
import TaxCardList from "@/components/player-overview/region-overview/TaxCardList";
import TotalsCardList from "@/components/player-overview/region-overview/TotalsCardList";
import { useFilters } from "@/lib/frontend/context/FilterContext";
import { usePlayer } from "@/lib/frontend/context/PlayerContext";
import { FilterInput } from "@/types/filters";
import { PlayerRegionDataType, RegionTaxSummary } from "@/types/resource";
import { Refresh } from "@mui/icons-material";
import { Box, Button, Typography } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import ProductionTotalsDEC from "./ProductionTotalsDEC";
import TaxTotalsDEC from "./TaxTotalsDEC";

export default function PlayerRegionOverview() {
  const { selectedPlayer } = usePlayer();
  const [data, setData] = useState<PlayerRegionDataType | null>(null);
  const [taxData, setTaxData] = useState<RegionTaxSummary[] | null>(null);
  const [loadingText, setLoadingText] = useState<string | null>(null);
  const { filters } = useFilters();

  const fetchPlayerData = useCallback(
    async (force: boolean = false) => {
      try {
        setLoadingText("Fetching base player data...");
        setData(null);
        setTaxData(null);

        const data = await fetchPlayerRegionData(
          selectedPlayer,
          filters,
          force
        );
        const taxData = await fetchPlayerTaxData(selectedPlayer, force);

        setLoadingText(null);
        setData(data);
        setTaxData(taxData);
      } catch (err) {
        console.error("Failed to fetch data", err);
        setLoadingText("An error occurred while loading data.");
      }
    },
    [filters, selectedPlayer]
  );

  useEffect(() => {
    (async () => {
      if (!filters) return;
      if (!selectedPlayer || selectedPlayer === "") {
        setData(null);
        setLoadingText(null);
        setTaxData(null);
        return;
      }

      await fetchPlayerData(false);
    })();
  }, [filters, selectedPlayer, fetchPlayerData]);

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
            onClick={() => fetchPlayerData(true)}
          >
            Refresh Data
          </Button>

          <ProductionTotalsDEC totalDec={data?.totals.totalDEC || 0} />
          {taxData ? <TaxTotalsDEC taxData={taxData} /> : null}
          {data ? (
            <>
              <Typography variant="h4" mt={2}>
                Production Overview
              </Typography>
              <RegionCardList data={data.regionSummary} />
              <Typography variant="h6" mt={2}>
                🌍 Total Net (All Regions)
              </Typography>
              <TotalsCardList regionTotals={data.totals} />
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

async function fetchPlayerRegionData(
  player: string,
  filters: FilterInput,
  force: boolean
): Promise<PlayerRegionDataType> {
  const res = await fetch("/api/player/region", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filters, player, force }),
  });
  return await res.json();
}

async function fetchPlayerTaxData(
  player: string,
  force: boolean
): Promise<RegionTaxSummary[]> {
  const res = await fetch("/api/player/tax", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ player, force }),
  });
  return await res.json();
}
