"use client";

import { useAsyncData } from "@/hooks/useAsyncData";
import {
  ResourceChartFilter,
  useResourceChartSelection,
} from "@/components/resource/ResourceChartFilter";
import { getAllTradeHubData } from "@/lib/backend/api/internal/trade-hub-data";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import {
  Alert,
  AlertTitle,
  Box,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import TradeHubCumulativeBurnChart from "./TradeHubCumulativeBurnChart";
import TradeHubLineChart from "./TradeHubLineChart";
import TradeHubQuantityHistoryChart from "./TradeHubQuantityHistoryChart";
import TradeHubVolumeChart from "./TradeHubVolumeChart";

export function TradeHubPage() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

  const { data: historicalTradeHubMetrics } = useAsyncData(
    "trade-hub",
    () => getAllTradeHubData(),
    { errorMessage: "Failed to load trade hub data" }
  );
  const { symbols, selected, setSelection, filteredData } =
    useResourceChartSelection(historicalTradeHubMetrics);

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

            <Typography variant="h6">Compare resource pools</Typography>
            <Typography variant="body2" color="text.secondary">
              Choose which pools to show below. Total DEC volume and the burn
              summary above always include all pools.
            </Typography>
            {symbols.length > 0 && (
              <ResourceChartFilter
                symbols={symbols}
                selected={selected}
                onChange={setSelection}
              />
            )}
            {selected.length === 0 && (
              <Typography color="text.secondary">
                Select resources to compare pools.
              </Typography>
            )}
            {selected.length > 0 && (
              <>
                <Box
                  display="flex"
                  flexDirection={isSmallScreen ? "column" : "row"}
                  gap={1}
                  mb={2}
                >
                  <Box flex={1}>
                    <Typography variant="h6" gutterBottom>
                      24-hour trade volume by resource and total DEC
                    </Typography>
                    <TradeHubVolumeChart
                      data={historicalTradeHubMetrics}
                      selectedSymbols={selected}
                    />
                  </Box>
                  <Box flex={1}>
                    <Typography variant="h6" gutterBottom>
                      DEC burned per day by resource
                    </Typography>
                    <TradeHubLineChart data={filteredData ?? []} />
                  </Box>
                </Box>

                <Box mt={3}>
                  <Typography variant="h6" gutterBottom>
                    Pool resource &amp; DEC quantities over time
                  </Typography>
                  <TradeHubQuantityHistoryChart data={filteredData ?? []} />
                </Box>
              </>
            )}
          </Box>
        </>
      )}
    </>
  );
}
