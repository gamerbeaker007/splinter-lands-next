"use client";

import { ResourcePresets } from "@/components/resource/conversion/calculator/ResourcePresets";
import { NATURAL_RESOURCES } from "@/lib/shared/statics";
import { Refresh, Sell, ShoppingCart } from "@mui/icons-material";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { FaInfoCircle } from "react-icons/fa";
import { ResourceInput } from "./ResourceInput";
import { ResourceOutput } from "./resourceOutput";

const fee = 0.9;

const RESOURCES = ["GRAIN", "WOOD", "STONE", "IRON", "AURA", "VOUCHER"];

export function ResourceCalculator() {
  const [resourcesInput, setResourcesInput] = useState<Record<string, number>>({
    GRAIN: 0,
    WOOD: 0,
    STONE: 0,
    IRON: 0,
    AURA: 0,
    VOUCHER: 0,
  });

  const [prices, setPrices] = useState<Record<string, number> | null>(null);
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [decExtra, setDecExtra] = useState(0);

  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch(`/api/resource/prices`);
      const data = await res.json();
      setPrices(data);
    } catch (err) {
      console.error("Failed to fetch prices:", err);
    }
  }, []);

  // Fetch on first load
  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  const handleChange = (resource: string, value: number) => {
    setResourcesInput((prev) => ({ ...prev, [resource]: value }));
    setDecExtra(0);
  };

  const dec_total = RESOURCES.reduce((sum, res) => {
    const amount = resourcesInput[res] || 0;
    const price = prices?.[res.toLowerCase()] ?? 0;
    let result = 0;
    if (NATURAL_RESOURCES.includes(res)) {
      result =
        mode === "buy" ? amount / ((1 / price) * fee) : amount * (price * fee);
    } else {
      result = res === "AURA" ? amount * price : amount * price * fee;
    }
    return sum + result;
  }, 0);

  const sps_amount = prices ? (dec_total + decExtra) / prices.sps : 0;

  const applyPreset = (
    preset: "wagons" | "auction" | "fortune" | "midnight" | "clear",
  ) => {
    switch (preset) {
      case "wagons":
        setResourcesInput({
          GRAIN: 0,
          WOOD: 40000,
          STONE: 10000,
          IRON: 4000,
          AURA: 2500,
          VOUCHER: 0,
        });
        setDecExtra(0);
        break;
      case "auction":
        setResourcesInput({
          GRAIN: 0,
          WOOD: 0,
          STONE: 0,
          IRON: 0,
          AURA: 1000,
          VOUCHER: 50,
        });
        setDecExtra(500);
        break;
      case "fortune":
        setResourcesInput({
          GRAIN: 0,
          WOOD: 0,
          STONE: 0,
          IRON: 0,
          AURA: 200,
          VOUCHER: 10,
        });
        setDecExtra(200);
        break;
      case "midnight":
        setResourcesInput({
          GRAIN: 0,
          WOOD: 0,
          STONE: 0,
          IRON: 0,
          AURA: 40,
          VOUCHER: 0,
        });
        setDecExtra(0);
        break;
      case "clear":
        setResourcesInput({
          GRAIN: 0,
          WOOD: 0,
          STONE: 0,
          IRON: 0,
          AURA: 0,
          VOUCHER: 0,
        });
        setDecExtra(0);
        break;
    }
  };

  return (
    <Box
      p={2}
      border="1px solid #ddd"
      borderRadius={4}
      borderColor="secondary.main"
      gap={2}
    >
      <Box display="flex" justifyContent="center" alignItems="center" gap={2}>
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(_, newMode) => {
            if (newMode) {
              setMode(newMode);
            }
          }}
          aria-label="mode toggle"
        >
          <ToggleButton value="buy" aria-label="buy mode">
            <ShoppingCart sx={{ mr: 1 }} />
            Buy
          </ToggleButton>
          <ToggleButton value="sell" aria-label="sell mode">
            <Sell sx={{ mr: 1 }} />
            Sell
          </ToggleButton>
        </ToggleButtonGroup>

        <Button
          size="small"
          variant="outlined"
          startIcon={<Refresh />}
          onClick={() => fetchPrices()}
        >
          Refresh Prices
        </Button>
      </Box>

      <ResourcePresets onSelect={applyPreset} />

      <Box display="flex" flexWrap="wrap" gap={2} alignItems="center">
        {RESOURCES.map((res, i) => (
          <Box key={res} display="flex" alignItems="center" gap={2}>
            <ResourceInput
              resource={res}
              value={resourcesInput[res]}
              onChange={(val) => handleChange(res, val)}
            />
            {i < RESOURCES.length - 1 && (
              <Typography fontSize={24}>+</Typography>
            )}
          </Box>
        ))}

        <Typography fontSize={24} fontWeight="bold">
          =
        </Typography>

        <ResourceOutput dec={dec_total} sps={sps_amount} decExtra={decExtra} />
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
  );
}
