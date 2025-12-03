"use client";

import { RESOURCE_ICON_MAP } from "@/lib/shared/statics";
import { SplLandPool } from "@/types/spl/landPools";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import {
  Alert,
  Box,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

interface Props {
  data: SplLandPool[];
  timeStamp: string | null;
}

interface PriceImpactResult {
  amountReceived: number;
  priceImpact: number;
}

const emptyPriceImpactResult: PriceImpactResult = {
  amountReceived: 0,
  priceImpact: 0,
};

const TAX_RATE = 0.9; // 10% tax on resource swaps

export function PriceImpactCalculator({ data, timeStamp }: Props) {
  const [selectedResource, setSelectedResource] = useState<string>("");
  const [decAmount, setDecAmount] = useState<string>("");
  const [resourceAmount, setResourceAmount] = useState<string>("");
  const [tokenSymbol, setTokenSymbol] = useState<string>("");
  const [amountReceived, setAmountReceived] = useState<number>(0);

  // Select first resource on load
  useEffect(() => {
    (async () => {
      if (data.length > 0 && !selectedResource) {
        setSelectedResource(data[0].token_symbol);
      }
    })();
  }, [data, selectedResource]);

  // Get the selected resource's data
  const selectedResourceData = useMemo(() => {
    return data.find((d: SplLandPool) => d.token_symbol === selectedResource);
  }, [data, selectedResource]);

  // Calculate price impact based on which field is filled
  const priceImpactResult = useMemo((): PriceImpactResult => {
    if (!selectedResourceData) return emptyPriceImpactResult;

    const decQuantity = parseFloat(selectedResourceData.dec_quantity);
    const resourceQuantity = parseFloat(selectedResourceData.resource_quantity);
    const constantProduct = decQuantity * resourceQuantity;
    const marketPrice = decQuantity / resourceQuantity;

    // If DEC amount is filled
    const parsedDecAmount = parseFloat(decAmount);
    if (decAmount && !isNaN(parsedDecAmount) && parsedDecAmount > 0) {
      const swapAmountNum = parsedDecAmount;

      // After swap: DEC pool increases, Resource pool decreases
      const newDecQuantity = decQuantity + swapAmountNum;
      const newResourceQuantity = constantProduct / newDecQuantity;
      const amountReceived = resourceQuantity - newResourceQuantity;

      if (amountReceived <= 0) return emptyPriceImpactResult;

      const effectivePrice = swapAmountNum / amountReceived;
      const priceImpact = ((effectivePrice - marketPrice) / marketPrice) * 100;

      return {
        amountReceived: amountReceived * TAX_RATE, // Apply 10% fee
        priceImpact,
      };
    }

    // If Resource amount is filled
    const parsedResourceAmount = parseFloat(resourceAmount);
    if (
      resourceAmount &&
      !isNaN(parsedResourceAmount) &&
      parsedResourceAmount > 0
    ) {
      const swapAmountNum = parsedResourceAmount;

      // After swap: Resource pool increases, DEC pool decreases
      const newResourceQuantity = resourceQuantity + swapAmountNum;
      const newDecQuantity = constantProduct / newResourceQuantity;
      const amountReceived = decQuantity - newDecQuantity;

      if (amountReceived <= 0) return emptyPriceImpactResult;

      const effectivePrice = amountReceived / swapAmountNum;
      const priceImpact = ((marketPrice - effectivePrice) / marketPrice) * 100;

      return {
        amountReceived: amountReceived * TAX_RATE, // Apply 10% fee
        priceImpact,
      };
    }

    return emptyPriceImpactResult;
  }, [selectedResourceData, decAmount, resourceAmount]);

  // Update resource amount when DEC amount changes
  const handleDecAmountChange = (value: string) => {
    setDecAmount(value);
    const parsedValue = parseFloat(value);
    if (
      value &&
      !isNaN(parsedValue) &&
      parsedValue > 0 &&
      selectedResourceData
    ) {
      const decQuantity = parseFloat(selectedResourceData.dec_quantity);
      const resourceQuantity = parseFloat(
        selectedResourceData.resource_quantity
      );
      const constantProduct = decQuantity * resourceQuantity;
      const swapAmountNum = parsedValue;
      const newDecQuantity = decQuantity + swapAmountNum;
      const newResourceQuantity = constantProduct / newDecQuantity;
      const amountReceived =
        (resourceQuantity - newResourceQuantity) * TAX_RATE;
      if (amountReceived > 0) {
        setResourceAmount(amountReceived.toFixed(3));
        setTokenSymbol(selectedResourceData.token_symbol);
        setAmountReceived(amountReceived);
      }
    } else {
      setResourceAmount("");
    }
  };

  // Update DEC amount when resource amount changes
  const handleResourceAmountChange = (value: string) => {
    setResourceAmount(value);
    const parsedValue = parseFloat(value);
    if (
      value &&
      !isNaN(parsedValue) &&
      parsedValue > 0 &&
      selectedResourceData
    ) {
      const decQuantity = parseFloat(selectedResourceData.dec_quantity);
      const resourceQuantity = parseFloat(
        selectedResourceData.resource_quantity
      );
      const constantProduct = decQuantity * resourceQuantity;
      const swapAmountNum = parsedValue;
      const newResourceQuantity = resourceQuantity + swapAmountNum;
      const newDecQuantity = constantProduct / newResourceQuantity;
      const amountReceived = (decQuantity - newDecQuantity) * TAX_RATE;
      if (amountReceived > 0) {
        setDecAmount(amountReceived.toFixed(3));
        setTokenSymbol("DEC");
        setAmountReceived(amountReceived);
      }
    } else {
      setDecAmount("");
    }
  };

  const formatNumber = (num: number, decimals: number = 2): string => {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  return (
    <Box mt={3}>
      <Typography variant="h5" gutterBottom>
        Liquidity Pool Price Impact Calculator
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Calculate the price impact when swapping DEC for resources in the
        liquidity pools. This uses the constant product formula (x × y = k) used
        by Uniswap and similar AMMs.
      </Alert>

      <Card variant="outlined">
        <CardContent>
          <Box display="flex" flexDirection="column" gap={3}>
            {/* Resource Selection */}
            <FormControl fullWidth>
              <InputLabel>Select Pool</InputLabel>
              <Select
                value={selectedResource}
                label="Select Pool"
                onChange={(e) => {
                  setSelectedResource(e.target.value);
                  setDecAmount("");
                  setResourceAmount("");
                }}
              >
                {data.map((item) => (
                  <MenuItem key={item.token_symbol} value={item.token_symbol}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Image
                        src={RESOURCE_ICON_MAP["DEC"]}
                        alt="DEC"
                        width={24}
                        height={24}
                      />
                      <Typography>-</Typography>
                      <Image
                        src={RESOURCE_ICON_MAP[item.token_symbol]}
                        alt={item.token_symbol}
                        width={24}
                        height={24}
                      />
                      <Typography>{item.token_symbol}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Pool Information */}
            {selectedResourceData && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Current Pool Status
                </Typography>
                <Typography variant="body2">
                  <strong>Last Updated:</strong>{" "}
                  {new Date(
                    timeStamp ? parseInt(timeStamp) : 0
                  ).toLocaleString()}
                </Typography>
                <Typography variant="body2">
                  <strong>DEC in Pool:</strong>{" "}
                  {formatNumber(parseFloat(selectedResourceData.dec_quantity))}
                </Typography>
                <Typography variant="body2">
                  <strong>{selectedResourceData.token_symbol} in Pool:</strong>{" "}
                  {formatNumber(
                    parseFloat(selectedResourceData.resource_quantity)
                  )}
                </Typography>
                <Typography variant="body2">
                  <strong>Market Price:</strong> 1{" "}
                  {selectedResourceData.token_symbol} ={" "}
                  {formatNumber(
                    parseFloat(selectedResourceData.dec_quantity) /
                      parseFloat(selectedResourceData.resource_quantity),
                    4
                  )}{" "}
                  DEC
                </Typography>
              </Box>
            )}

            {/* Swap Amount Inputs */}
            {selectedResourceData && (
              <Box display="flex" flexDirection="row" gap={2}>
                <Stack>
                  <Image
                    src={RESOURCE_ICON_MAP["DEC"]}
                    alt="DEC"
                    width={100}
                    height={100}
                  />
                  <TextField
                    label="DEC Amount"
                    type="text"
                    value={decAmount}
                    onChange={(e) => handleDecAmountChange(e.target.value)}
                    fullWidth
                    slotProps={{
                      input: {
                        inputProps: {
                          inputMode: "decimal",
                        },
                      },
                    }}
                  />
                </Stack>
                <Box display="flex" alignItems="center" justifyContent="center">
                  <SwapHorizIcon sx={{ width: 100, height: 100 }} />
                </Box>
                <Stack>
                  <Image
                    src={RESOURCE_ICON_MAP[selectedResourceData.token_symbol]}
                    alt={selectedResourceData.token_symbol}
                    width={100}
                    height={100}
                  />
                  <TextField
                    label={`${selectedResourceData.token_symbol} Amount`}
                    type="text"
                    value={resourceAmount}
                    onChange={(e) => handleResourceAmountChange(e.target.value)}
                    fullWidth
                    slotProps={{
                      input: {
                        inputProps: {
                          inputMode: "decimal",
                        },
                      },
                    }}
                  />
                </Stack>
              </Box>
            )}

            {/* Results */}

            <Box
              sx={{
                p: 2,
                bgcolor: "background.paper",
                borderRadius: 1,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography variant="h6" gutterBottom>
                Swap Results
              </Typography>

              <Box display="flex" flexDirection="column" gap={1}>
                <Typography variant="body2">
                  <strong>You will receive:</strong>{" "}
                  {formatNumber(amountReceived)} {tokenSymbol}
                </Typography>

                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: "bold",
                    color:
                      priceImpactResult.priceImpact > 5
                        ? "error.main"
                        : priceImpactResult.priceImpact > 1
                          ? "warning.main"
                          : "success.main",
                  }}
                >
                  <strong>Price Impact:</strong>{" "}
                  {formatNumber(priceImpactResult.priceImpact, 2)}%
                </Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
