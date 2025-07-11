"use client";

import { Sell, ShoppingCart } from "@mui/icons-material";
import {
  Alert,
  AlertTitle,
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { FaInfoCircle } from "react-icons/fa";
import { ResourceInput } from "./ResourceInput";
import { ResourceOutput } from "./resourceOutput";
import { ResourcePresets } from "@/components/resource/conversion/calculator/ResourcePresets";

const sell_fee = 0.9; // When you sell the resource you need to pay the 10%
const buy_fee = 1.1; // When you buy the resource you need to increas the DEC by 10%

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

  useEffect(() => {
    fetch("/api/resource/prices", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then(setPrices)
      .catch(console.error);
  }, []);

  const handleChange = (resource: string, value: number) => {
    setResourcesInput((prev) => ({ ...prev, [resource]: value }));
    setDecExtra(0);
  };

  const dec_total = RESOURCES.reduce((sum, res) => {
    const amount = resourcesInput[res] || 0;
    const price = prices?.[res.toLowerCase()] ?? 0;
    const raw = amount * price;
    const taxed =
      res === "AURA" ? raw : mode == "buy" ? raw * buy_fee : raw * sell_fee;
    return sum + taxed;
  }, 0);

  const sps_amount = (dec_total + decExtra) / (prices?.sps ?? 0);

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
        // Define your own resource values
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
      <Box display="flex" justifyContent="center" width="100%">
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(_, newMode) => newMode && setMode(newMode)}
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

        {/* Equal sign before output */}
        <Typography fontSize={24} fontWeight="bold">
          =
        </Typography>

        {/* Final output */}
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
        Potion.{" "}
      </Alert>
    </Box>
  );
}
