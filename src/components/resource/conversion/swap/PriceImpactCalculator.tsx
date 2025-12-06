"use client";

import {
  PriceImpactResult,
  calculatePriceImpact,
} from "@/lib/shared/priceUtils";
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
  TextField,
  Typography,
} from "@mui/material";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

interface Props {
  data: SplLandPool[];
  timeStamp: string | null;
}

const emptyPriceImpactResult: PriceImpactResult = {
  amountReceived: 0,
  priceImpact: 0,
};

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

    const parsedDecAmount = parseFloat(decAmount);
    if (decAmount && !isNaN(parsedDecAmount) && parsedDecAmount > 0) {
      return calculatePriceImpact(
        parsedDecAmount,
        decQuantity,
        resourceQuantity,
      );
    }

    const parsedResourceAmount = parseFloat(resourceAmount);
    if (
      resourceAmount &&
      !isNaN(parsedResourceAmount) &&
      parsedResourceAmount > 0
    ) {
      return calculatePriceImpact(
        parsedResourceAmount,
        resourceQuantity,
        decQuantity,
      );
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
        selectedResourceData.resource_quantity,
      );
      const result = calculatePriceImpact(
        parsedValue,
        decQuantity,
        resourceQuantity,
      );
      if (result.amountReceived > 0) {
        setResourceAmount(result.amountReceived.toFixed(3));
        setTokenSymbol(selectedResourceData.token_symbol);
        setAmountReceived(result.amountReceived);
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
        selectedResourceData.resource_quantity,
      );
      const result = calculatePriceImpact(
        parsedValue,
        resourceQuantity,
        decQuantity,
      );
      if (result.amountReceived > 0) {
        setDecAmount(result.amountReceived.toFixed(3));
        setTokenSymbol("DEC");
        setAmountReceived(result.amountReceived);
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
    <Box mt={3} minWidth={200} maxWidth={500}>
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
                    timeStamp ? parseInt(timeStamp) : 0,
                  ).toLocaleString()}
                </Typography>
                <Typography variant="body2">
                  <strong>DEC in Pool:</strong>{" "}
                  {formatNumber(parseFloat(selectedResourceData.dec_quantity))}
                </Typography>
                <Typography variant="body2">
                  <strong>{selectedResourceData.token_symbol} in Pool:</strong>{" "}
                  {formatNumber(
                    parseFloat(selectedResourceData.resource_quantity),
                  )}
                </Typography>
                <Typography variant="body2">
                  <strong>Market Price:</strong> 1{" "}
                  {selectedResourceData.token_symbol} ={" "}
                  {formatNumber(
                    parseFloat(selectedResourceData.dec_quantity) /
                      parseFloat(selectedResourceData.resource_quantity),
                    4,
                  )}{" "}
                  DEC
                </Typography>
              </Box>
            )}

            {/* Swap Amount Inputs */}
            {selectedResourceData && (
              <Box display="flex" flexDirection="row" flexWrap={"wrap"} gap={2}>
                <Box
                  display={"flex"}
                  flexDirection={"column"}
                  alignItems="center"
                  justifyContent="center"
                  maxWidth={190}
                >
                  <Image
                    src={RESOURCE_ICON_MAP["DEC"]}
                    alt="DEC"
                    width={80}
                    height={80}
                  />
                  <TextField
                    label="DEC Amount"
                    type="text"
                    value={decAmount}
                    onChange={(e) => handleDecAmountChange(e.target.value)}
                    slotProps={{
                      input: {
                        inputProps: {
                          inputMode: "decimal",
                        },
                      },
                    }}
                  />
                </Box>
                <Box display="flex" alignItems="center" justifyContent="center">
                  <SwapHorizIcon sx={{ width: 50, height: 50 }} />
                </Box>
                <Box
                  display={"flex"}
                  flexDirection={"column"}
                  alignItems="center"
                  justifyContent="center"
                  maxWidth={190}
                >
                  {" "}
                  <Image
                    src={RESOURCE_ICON_MAP[selectedResourceData.token_symbol]}
                    alt={selectedResourceData.token_symbol}
                    width={80}
                    height={80}
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
                </Box>
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
                <Box mb={1} display={"flex"} flexDirection={"row"} gap={1}>
                  <Typography variant="body2">
                    <strong>You will receive:</strong>{" "}
                    {formatNumber(amountReceived)} {tokenSymbol}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    (incl fee 10%)
                  </Typography>
                </Box>

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
