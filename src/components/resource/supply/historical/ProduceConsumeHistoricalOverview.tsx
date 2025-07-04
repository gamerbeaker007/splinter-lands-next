"use client";

import { Box, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useEffect, useState } from "react";
import { ResourceSupplyOverview } from "@/types/resourceSupplyOverview";
import SupplyLineChart from "./SupplyLineChart";
import ProduceConsumeBarChart from "./ProduceConsumeBarChart";

export function ProduceConsumeHistoricalOverview() {
  const [historicalResourcesSupply, setHistoricalResourcesSupply] = useState<
    ResourceSupplyOverview[] | null
  >(null);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

  useEffect(() => {
    fetch("/api/resource/supply/", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then(setHistoricalResourcesSupply)
      .catch(console.error);
  }, []);

  return (
    <>
      {historicalResourcesSupply && (
        <>
          <Box minHeight={700} mt={2}>
            {/* Top section: Resource Factor */}
            <Box marginBottom={3}>
              <Typography variant="h5" gutterBottom>
                Total Supply (leaderboard + trade hub)
              </Typography>

              <SupplyLineChart
                data={historicalResourcesSupply}
                type="total_supply"
              />
            </Box>

            {/* Bottom section: Two side-by-side charts */}
            <Typography variant="h5" gutterBottom>
              Production vs Consumption
            </Typography>
            <Box
              display="flex"
              flexDirection={isSmallScreen ? "column" : "row"}
              gap={1}
            >
              <Box flex={1}>
                <SupplyLineChart
                  data={historicalResourcesSupply}
                  type="daily_consume"
                />
              </Box>
              <Box flex={1}>
                <SupplyLineChart
                  data={historicalResourcesSupply}
                  type="daily_production"
                />
              </Box>
            </Box>
          </Box>

          <Box minHeight={700} mt={2}>
            {/* Top section: Resource Factor */}
            <Box marginBottom={3}>
              <Typography variant="h5" gutterBottom>
                Net Daily Production
              </Typography>

              <ProduceConsumeBarChart data={historicalResourcesSupply} />
            </Box>
          </Box>
        </>
      )}
    </>
  );
}
