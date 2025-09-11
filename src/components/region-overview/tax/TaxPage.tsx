"use client";

import { useFilters } from "@/lib/frontend/context/FilterContext";
import { Box, Typography, useMediaQuery, useTheme } from "@mui/material";
import { TaxChartsWrapper } from "./TaxChartSection";
import { TopCaptureRateList } from "./TopCapturedRateList";
import { TopTaxEarnersList } from "./TopTaxEarnersList";
import { useRegionTaxInfo } from "@/hooks/useRegionTax";
import LoadingComponent from "@/components/ui/LoadingComponent";
import ErrorComponent from "@/components/ui/ErrorComponent";

export function TaxPage() {
  const { filters } = useFilters();
  const { regionTax, error, loading } = useRegionTaxInfo(filters);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

  if (loading) {
    return (
      <LoadingComponent title={"Loading data (region tax information)…"} />
    );
  }

  if (error) {
    return (
      <ErrorComponent
        title={`Failed to load region tax information: ${error}`}
      />
    );
  }
  return (
    <>
      {regionTax && (
        <Box>
          <Typography variant="h6">Leaderboard Tax Collectors</Typography>
          <Box
            display="flex"
            flexDirection={isSmallScreen ? "column" : "row"}
            gap={1}
          >
            <TopCaptureRateList data={regionTax} type="castle" />
            <TopCaptureRateList data={regionTax} type="keep" />
            <TopTaxEarnersList data={regionTax} type="castle" />
            <TopTaxEarnersList data={regionTax} type="keep" />
          </Box>

          <TaxChartsWrapper data={regionTax} />
        </Box>
      )}
    </>
  );
}
