"use client";

import { ResourceHubMetrics } from "@/generated/prisma";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import {
  Alert,
  AlertTitle,
  Box,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useEffect, useState } from "react";
import { PriceImpactCalculatorWrapper } from "./PriceImpactCalculatorWrapper";
import TradeHubCumulativeBurnChart from "./TradeHubCumulativeBurnChart";
import TradeHubLineChart from "./TradeHubLineChart";

export function TradeHubPage() {
  const [historicalTradeHubMetrics, setHistoricalTradeHubMetrics] = useState<
    ResourceHubMetrics[] | null
  >(null);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

  useEffect(() => {
    fetch("/api/resource/trade-hub/", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then(setHistoricalTradeHubMetrics)
      .catch(console.error);
  }, []);

  return (
    <>
      {historicalTradeHubMetrics && (
        <>
          <Box minHeight={700} mt={2}>
            {/* Top section: Resource Factor */}
            <Box marginBottom={3}>
              <Typography variant="h5" gutterBottom>
                Trade Hub information
              </Typography>
              Daily DEC burned across all resource pools, along with a
              cumulative burn line for context.
              <Alert
                severity="warning"
                icon={<WarningAmberIcon />}
                sx={{
                  mt: 2,
                  mb: 2,
                  whiteSpace: "pre-line",
                  borderRadius: 2,
                  fontSize: "0.9rem",
                }}
              >
                <AlertTitle sx={{ fontWeight: "bold" }}>
                  DEC Burn Disclaimer
                </AlertTitle>
                This chart shows estimated cumulative DEC burned, based on daily
                snapshots of a 24-hour rolling trade volume.
                {"\n"}
                Snapshots are taken once per day, but the exact timing and
                update frequency of the source data are unknown.
                {"\n"}
                As a result, some short-term activity may be missed, and totals
                should be treated as indicative rather than exact.
              </Alert>
              <TradeHubCumulativeBurnChart data={historicalTradeHubMetrics} />
            </Box>

            {/* Bottom section: Two side-by-side charts */}
            <Box
              display="flex"
              flexDirection={isSmallScreen ? "column" : "row"}
              gap={1}
              mb={2}
            >
              <Box flex={1}>
                <Typography variant="h6" gutterBottom>
                  24-hour trade volume for each individual resource pool Total
                </Typography>
                <TradeHubLineChart
                  data={historicalTradeHubMetrics}
                  type="dec_volume_1"
                />
              </Box>
              <Box flex={1}>
                <Typography variant="h6" gutterBottom>
                  DEC burned per day across all pools
                </Typography>
                <TradeHubLineChart
                  data={historicalTradeHubMetrics}
                  type="dec_burned"
                />
              </Box>
            </Box>
          </Box>
        </>
      )}

      {/* Price Impact Calculator - Separate data source */}
      <PriceImpactCalculatorWrapper />
    </>
  );
}
