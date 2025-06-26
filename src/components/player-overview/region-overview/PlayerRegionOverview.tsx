"use client";

import RegionCardList from "@/components/player-overview/region-overview/RegionCardList";
import TaxCardList from "@/components/player-overview/region-overview/TaxCardList";
import TotalsCardList from "@/components/player-overview/region-overview/TotalsCardList";
import { useFilters } from "@/lib/frontend/context/FilterContext";
import { FilterInput } from "@/types/filters";
import { PlayerRegionDataType, RegionTaxSummary } from "@/types/resource";
import { Box, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import ProductionTotalsDEC from "./ProductionTotalsDEC";
import TaxTotalsDEC from "./TaxTotalsDEC";

type Props = {
  player: string;
};

export default function PlayerRegionOverview({ player }: Props) {
  const [data, setData] = useState<PlayerRegionDataType | null>(null);
  const [taxData, setTaxData] = useState<RegionTaxSummary[] | null>(null);
  const [loadingText, setLoadingText] = useState<string | null>(null);
  const { filters } = useFilters();

  useEffect(() => {
    if (!filters) return;
    if (!player || player == "") {
      setData(null);
      setLoadingText(null);
      setTaxData(null);
      return;
    }

    const run = async () => {
      try {
        setLoadingText("Fetching base player data...");
        setData(null);
        setTaxData(null);

        const data = await fetchPlayerRegionData(player, filters);
        const taxData = await fetchPlayerTaxData(player);

        setLoadingText(null);
        setData(data);
        setTaxData(taxData);
      } catch (err) {
        console.error("Failed to fetch data", err);
        setLoadingText("An error occurred while loading data.");
      }
    };
    run();
  }, [filters, player]);

  console.log(`TAX_DATA: ${taxData}`);
  return (
    <>
      {loadingText ? (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body1">{loadingText}</Typography>
        </Box>
      ) : (
        <>
          <ProductionTotalsDEC data={data?.totals} />
          {taxData ? <TaxTotalsDEC taxData={taxData} /> : null}
          {data ? (
            <>
              <Typography variant="h4" mt={2}>
                Production Overview
              </Typography>
              <RegionCardList data={data.regionSummary} />
              <Typography variant="h6" mt={2}>
                🌍 Total Net (All Regions){" "}
              </Typography>
              <TotalsCardList data={data.totals} />
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
): Promise<PlayerRegionDataType> {
  const res = await fetch("/api/player/region", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filters: filters, player: player }),
  });
  return await res.json();
}

async function fetchPlayerTaxData(player: string): Promise<RegionTaxSummary[]> {
  const res = await fetch("/api/player/tax", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ player: player }),
  });
  return await res.json();
}
