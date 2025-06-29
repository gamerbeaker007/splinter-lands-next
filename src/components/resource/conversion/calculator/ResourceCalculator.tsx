"use client";

import { NATURAL_RESOURCES } from "@/scripts/lib/utils/statics";
import { Box, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { ResourceInput } from "./ResourceInput";
import { ResourceOutput } from "./resourceOutput";

const transaction_fee = 0.9;

export function ResourceCalculator() {
  const [resourcesInput, setResourcesInput] = useState<Record<string, number>>({
    GRAIN: 0,
    WOOD: 0,
    STONE: 0,
    IRON: 0,
  });

  const [prices, setPrices] = useState<Record<string, number> | null>(null);

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
  };

  const dec_total = NATURAL_RESOURCES.reduce((sum, res) => {
    const amount = resourcesInput[res] || 0;
    const price = prices?.[res.toLowerCase()] ?? 0;
    return sum + amount * price * transaction_fee;
  }, 0);

  const sps_amount = dec_total / (prices?.["sps"] ?? 0);

  return (
    <Box
      p={2}
      border="1px solid #ddd"
      borderRadius={4}
      display="flex"
      flexWrap="wrap"
      gap={2}
      alignItems="center"
    >
      {NATURAL_RESOURCES.map((res, i) => (
        <Box key={res} display="flex" alignItems="center" gap={2}>
          <ResourceInput
            resource={res}
            value={resourcesInput[res]}
            onChange={(val) => handleChange(res, val)}
          />
          {i < NATURAL_RESOURCES.length - 1 && (
            <Typography fontSize={24}>+</Typography>
          )}
        </Box>
      ))}

      {/* Equal sign before output */}
      <Typography fontSize={24} fontWeight="bold">
        =
      </Typography>

      {/* Final output */}
      <ResourceOutput dec={dec_total} sps={sps_amount} />
    </Box>
  );
}
