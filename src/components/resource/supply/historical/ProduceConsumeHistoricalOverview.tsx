"use client";

import { ResourceSupplyOverview } from "@/types/resourceSupplyOverview";
import { Box, Typography, useMediaQuery, useTheme } from "@mui/material";
import ProduceConsumeBarChart from "./ProduceConsumeBarChart";
import SupplyLineChart from "./SupplyLineChart";

export function ProduceConsumeHistoricalOverview({
  data: historicalResourcesSupply,
}: {
  data: ResourceSupplyOverview[] | undefined;
}) {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

  if (
    historicalResourcesSupply &&
    !historicalResourcesSupply.some(
      (entry) => Object.keys(entry.resource).length > 0
    )
  ) {
    return (
      <Typography color="text.secondary" mt={2}>
        No historical data for the selected resources.
      </Typography>
    );
  }

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
