import { useLandLiquidityPools } from "@/hooks/action-based/useLandLiquidityPools";
import { Alert, Box, CircularProgress, Typography } from "@mui/material";
import { PriceImpactCalculator } from "./PriceImpactCalculator";

export function PriceImpactCalculatorWrapper() {
  const { landPoolData, error, loading } = useLandLiquidityPools();

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!landPoolData || landPoolData.length === 0) {
    return (
      <Box mt={3}>
        <Typography>No liquidity pool data available</Typography>
      </Box>
    );
  }

  return <PriceImpactCalculator data={landPoolData} />;
}
