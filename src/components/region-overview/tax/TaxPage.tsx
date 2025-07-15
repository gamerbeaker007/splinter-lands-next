"use client";

import { useFilters } from "@/lib/frontend/context/FilterContext";
import { RegionTax } from "@/types/regionTax";
import { Box, Typography, useMediaQuery, useTheme } from "@mui/material";
import Container from "@mui/material/Container";
import { useEffect, useState } from "react";
import { TaxChartsWrapper } from "./TaxChartSection";
import { TopCaptureRateList } from "./TopCapturedRateList";
import { TopTaxEarnersList } from "./TopTaxEarnersList";

export function TaxPage() {
  const [data, setData] = useState<RegionTax[] | null>(null);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

  const { filters } = useFilters();

  useEffect(() => {
    if (!filters) return;

    fetch("/api/region/tax", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filters),
    })
      .then((res) => res.json())
      .then((raw) => {
        setData(raw);
      })
      .catch(console.error);
  }, [filters]);

  return (
    <Container maxWidth={false} sx={{ px: { xs: 2, md: 6, lg: 12 } }}>
      {data && (
        <Box>
          <Typography variant="h6">Leaderboard Tax Collectors</Typography>
          <Box
            display="flex"
            flexDirection={isSmallScreen ? "column" : "row"}
            gap={1}
          >
            <TopCaptureRateList data={data} type="castle" />
            <TopCaptureRateList data={data} type="keep" />
            <TopTaxEarnersList data={data} type="castle" />
            <TopTaxEarnersList data={data} type="keep" />
          </Box>

          <TaxChartsWrapper data={data} />
        </Box>
      )}
    </Container>
  );
}
