"use client";

import RegionCardList from "@/components/player-overview/region-overview/RegionCardList";
import TaxCardList from "@/components/player-overview/region-overview/TaxCardList";
import TotalsCardList from "@/components/player-overview/region-overview/TotalsCardList";
import { usePlayerRegionData } from "@/hooks/usePlayerRegionData";
import { useFilters } from "@/lib/frontend/context/FilterContext";
import { usePlayer } from "@/lib/frontend/context/PlayerContext";
import { Refresh } from "@mui/icons-material";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Typography,
} from "@mui/material";
import { useState } from "react";
import ProductionTotalsDEC from "./ProductionTotalsDEC";
import TaxTotalsDEC from "./TaxTotalsDEC";

export default function PlayerRegionOverview() {
  const { selectedPlayer } = usePlayer();
  const { filters } = useFilters();
  const [includeTaxes, setIncludeTaxes] = useState(true);
  const [includeTransferFee, setIncludeTransferFee] = useState(true);

  // Use server action hook
  const { data, taxData, loadingText, refetch } = usePlayerRegionData(
    selectedPlayer,
    filters,
    includeTaxes,
    includeTransferFee
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
              <FormGroup row>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={includeTaxes}
                      onChange={(e) => setIncludeTaxes(e.target.checked)}
                    />
                  }
                  label="Include Taxes"
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={includeTransferFee}
                      onChange={(e) => setIncludeTransferFee(e.target.checked)}
                    />
                  }
                  label="Include Transfer Fee"
                />
              </FormGroup>

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
