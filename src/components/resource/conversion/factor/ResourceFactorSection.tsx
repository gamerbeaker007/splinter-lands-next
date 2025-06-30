"use client";

import { useEffect, useState } from "react";
import { ResourceFactorChart } from "./ResourceFactorChart";
import { ResourceHubMetrics } from "@/generated/prisma";
import { Box, Typography, useMediaQuery, useTheme } from "@mui/material";
import { ResourcePriceChart } from "./ResourcePriceChart";

export function ResourceFactorSection() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

  const [tradeHubMetrics, setTradeHubMetrics] = useState<
    ResourceHubMetrics[] | null
  >(null);

  useEffect(() => {
    fetch("/api/resource/trade-hub", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then(setTradeHubMetrics)
      .catch(console.error);
  }, []);

  return (
    <Box minHeight={700} mt={4}>
      {/* Top section: Resource Factor */}
      <Box marginBottom={6}>
        <Typography variant="h5" gutterBottom>
          Resource Factor Graph
        </Typography>
        <Typography variant="body1">
          This chart shows the relative value of each resource compared to
          Grain, based on the official whitepaper.
        </Typography>
        <Typography variant="body2">
          <strong>Grain:</strong> 0.02
          <br />
          <strong>Wood:</strong> 0.005 — <em>1 Wood = 4 Grain</em>
          <br />
          <strong>Stone:</strong> 0.002 — <em>1 Stone = 10 Grain</em>
          <br />
          <strong>Iron:</strong> 0.0005 — <em>1 Iron = 40 Grain</em>
        </Typography>
        <Box marginTop={2}>
          {tradeHubMetrics ? (
            <ResourceFactorChart data={tradeHubMetrics} />
          ) : null}
        </Box>
      </Box>

      {/* Bottom section: Two side-by-side charts */}
      <Box
        display="flex"
        flexDirection={isSmallScreen ? "column" : "row"}
        gap={4}
      >
        <Box flex={1}>
          <Typography variant="h5" gutterBottom>
            Resource per 1000 DEC
          </Typography>
          <Typography variant="body2">
            Shows how many resources you can acquire by spending 1000 DEC (~$1
            USD).
          </Typography>
          {tradeHubMetrics ? (
            <ResourcePriceChart data={tradeHubMetrics} mode="dec" logY={true} />
          ) : null}
        </Box>

        <Box flex={1}>
          <Typography variant="h5" gutterBottom>
            Cost per 1000 Resources
          </Typography>
          <Typography variant="body2">
            Shows the DEC cost to acquire 1000 units of each resource.
          </Typography>
          {tradeHubMetrics ? (
            <ResourcePriceChart
              data={tradeHubMetrics}
              mode="resource"
              logY={true}
            />
          ) : null}
        </Box>
      </Box>
    </Box>
  );
}
