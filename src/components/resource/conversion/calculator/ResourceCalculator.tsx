"use client";

import { ResourcePresets } from "@/components/resource/conversion/calculator/ResourcePresets";
import { Refresh, Sell, ShoppingCart } from "@mui/icons-material";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { FaInfoCircle } from "react-icons/fa";
import { ResourceInput } from "./ResourceInput";
import { ResourceOutput } from "./resourceOutput";
import { Mode } from "@/types/mode";
import { PresetName, RESOURCE_PRESETS } from "@/constants/conversion/presets";
import {
  CALCULATOR_RESOURCES,
  CalculatorResource,
} from "@/constants/resource/resource";
import { usePrices } from "@/hooks/usePrices";
import { useResourceConversion } from "@/components/resource/conversion/calculator/userResourceConversion";
import AuraPriceBox from "@/components/resource/conversion/calculator/AuraPriceBox";

export const EMPTY_RESOURCE_INPUT: Record<CalculatorResource, number> =
  Object.fromEntries(CALCULATOR_RESOURCES.map((r) => [r, 0])) as Record<
    CalculatorResource,
    number
  >;

export function ResourceCalculator() {
  const [resourcesInput, setResourcesInput] =
    useState<Record<CalculatorResource, number>>(EMPTY_RESOURCE_INPUT);

  const [mode, setMode] = useState<Mode>("buy");
  const [decExtra, setDecExtra] = useState(0);
  const { prices, loading, error, fetchPrices } = usePrices();
  const { dec_total, sps_amount } = useResourceConversion(
    mode,
    resourcesInput,
    decExtra,
    prices,
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <Typography variant="body1">Loading prices...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        <AlertTitle>Error</AlertTitle>
        Failed to fetch prices: {error}
      </Alert>
    );
  }

  const handleChange = (resource: CalculatorResource, value: number) => {
    setResourcesInput((prev) => ({ ...prev, [resource]: value }));
    setDecExtra(0);
  };

  const applyPreset = (preset: PresetName) => {
    const { input, decExtra } = RESOURCE_PRESETS[preset];
    setResourcesInput(input);
    setDecExtra(decExtra);
  };

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <Box
        p={2}
        border="1px solid #ddd"
        borderRadius={4}
        borderColor="secondary.main"
        display="flex"
        flexDirection="column"
        gap={2}
      >
        <Stack
          display="flex"
          justifyContent="center"
          alignItems="center"
          gap={2}
        >
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={(_, newMode) => {
              if (newMode) {
                setMode(newMode);
              }
            }}
          >
            <ToggleButton value="buy">
              <ShoppingCart sx={{ mr: 1 }} />
              Buy
            </ToggleButton>
            <ToggleButton value="sell">
              <Sell sx={{ mr: 1 }} />
              Sell
            </ToggleButton>
          </ToggleButtonGroup>

          <Button
            size="small"
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => fetchPrices()}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh Prices"}
          </Button>
        </Stack>

        <ResourcePresets onSelect={applyPreset} />

        <Box display="flex" flexWrap="wrap" gap={2} alignItems="center">
          {CALCULATOR_RESOURCES.map((res, i) => (
            <Box key={res} display="flex" alignItems="center" gap={2}>
              <ResourceInput
                resource={res}
                value={resourcesInput[res]}
                onChange={(val) => handleChange(res, val)}
              />
              {i < CALCULATOR_RESOURCES.length - 1 && (
                <Typography fontSize={24}>+</Typography>
              )}
            </Box>
          ))}

          <Typography fontSize={24} fontWeight="bold">
            =
          </Typography>

          <ResourceOutput
            dec={dec_total}
            sps={sps_amount}
            decExtra={decExtra}
          />
        </Box>

        <Alert
          severity="info"
          icon={<FaInfoCircle />}
          sx={{
            mt: 2,
            mb: 2,
            whiteSpace: "pre-line",
            borderRadius: 2,
            fontSize: "0.9rem",
            maxWidth: 600,
          }}
        >
          <AlertTitle sx={{ fontWeight: "bold" }}>Info</AlertTitle>
          For natural resources, the 10% Trade Hub fee is included in the
          calculations.
          {"\n"}
          For AURA, the value is estimated based on the price of the Midnight
          Potion.
        </Alert>
      </Box>
      {prices && <AuraPriceBox prices={prices} />}
    </Box>
  );
}
