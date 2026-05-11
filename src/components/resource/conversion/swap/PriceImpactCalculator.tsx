"use client";

import {
  computeInputForDesiredOutput,
  computeSwapAmounts,
} from "@/lib/shared/landManagerUtils";
import { calculatePriceImpact } from "@/lib/shared/priceUtils";
import { RESOURCE_ICON_MAP } from "@/lib/shared/statics";
import { SplLandPool } from "@/types/spl/landPools";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import Image from "next/image";
import { useMemo, useState } from "react";

const poolFor = (pools: SplLandPool[], sym: string) =>
  pools.find((p) => p.token_symbol === sym);

interface SwapResult {
  hops: HopDetail[];
  payResult: number;
  receiveResult: number;
}

// Pure forward calculation: given a pay amount, returns hop details and the receive amount.
// Direction-independent — "receive" mode just resolves the required pay amount first, then calls this.
function computeForwardHops(
  pools: SplLandPool[],
  fromSymbol: string,
  toSymbol: string,
  payAmount: number
): SwapResult | null {
  const hops: HopDetail[] = [];

  if (fromSymbol === toSymbol) {
    const { out_amount_2 } = computeSwapAmounts(
      pools,
      fromSymbol,
      toSymbol,
      payAmount
    );
    hops.push({
      label: `${fromSymbol} → ${toSymbol} (transfer)`,
      inputAmount: payAmount,
      inputSymbol: fromSymbol,
      outputAmount: out_amount_2,
      outputSymbol: toSymbol,
      priceImpact: 0,
      feeApplied: true,
    });
    return { hops, payResult: payAmount, receiveResult: out_amount_2 };
  }

  if (fromSymbol === "DEC") {
    const pool = poolFor(pools, toSymbol);
    if (!pool) return null;
    const r = calculatePriceImpact(
      payAmount,
      Number.parseFloat(pool.dec_quantity),
      Number.parseFloat(pool.resource_quantity)
    );
    hops.push({
      label: `DEC → ${toSymbol}`,
      inputAmount: payAmount,
      inputSymbol: "DEC",
      outputAmount: r.amountReceived,
      outputSymbol: toSymbol,
      priceImpact: r.priceImpact,
      feeApplied: true,
    });
    return { hops, payResult: payAmount, receiveResult: r.amountReceived };
  }

  if (toSymbol === "DEC") {
    const pool = poolFor(pools, fromSymbol);
    if (!pool) return null;
    const r = calculatePriceImpact(
      payAmount,
      Number.parseFloat(pool.resource_quantity),
      Number.parseFloat(pool.dec_quantity)
    );
    hops.push({
      label: `${fromSymbol} → DEC`,
      inputAmount: payAmount,
      inputSymbol: fromSymbol,
      outputAmount: r.amountReceived,
      outputSymbol: "DEC",
      priceImpact: r.priceImpact,
      feeApplied: true,
    });
    return { hops, payResult: payAmount, receiveResult: r.amountReceived };
  }

  // resource → DEC (fee) → resource (no fee)
  const fromPool = poolFor(pools, fromSymbol);
  const toPool = poolFor(pools, toSymbol);
  if (!fromPool || !toPool) return null;
  const hop1 = calculatePriceImpact(
    payAmount,
    Number.parseFloat(fromPool.resource_quantity),
    Number.parseFloat(fromPool.dec_quantity)
  );
  hops.push({
    label: `Hop 1: ${fromSymbol} → DEC (fee)`,
    inputAmount: payAmount,
    inputSymbol: fromSymbol,
    outputAmount: hop1.amountReceived,
    outputSymbol: "DEC",
    priceImpact: hop1.priceImpact,
    feeApplied: true,
  });
  const hop2 = calculatePriceImpact(
    hop1.amountReceived,
    Number.parseFloat(toPool.dec_quantity),
    Number.parseFloat(toPool.resource_quantity),
    false
  );
  hops.push({
    label: `Hop 2: DEC → ${toSymbol} (no fee)`,
    inputAmount: hop1.amountReceived,
    inputSymbol: "DEC",
    outputAmount: hop2.amountReceived,
    outputSymbol: toSymbol,
    priceImpact: hop2.priceImpact,
    feeApplied: false,
  });
  return { hops, payResult: payAmount, receiveResult: hop2.amountReceived };
}

interface Props {
  data: SplLandPool[];
  timeStamp: string | null;
}

type Direction = "pay" | "receive";

interface HopDetail {
  label: string;
  inputAmount: number;
  inputSymbol: string;
  outputAmount: number;
  outputSymbol: string;
  priceImpact: number;
  feeApplied: boolean;
}

const fmt = (n: number, d = 3) =>
  n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: d,
  });

const impactColor = (pct: number) =>
  pct > 5 ? "error.main" : pct > 1 ? "warning.main" : "success.main";

function ResourceIcon({
  symbol,
  size = 32,
}: {
  symbol: string;
  size?: number;
}) {
  const src = RESOURCE_ICON_MAP[symbol];
  if (!src) return <Typography variant="caption">{symbol}</Typography>;
  return <Image src={src} alt={symbol} width={size} height={size} />;
}

function PoolInfo({ pool, label }: { pool: SplLandPool; label: string }) {
  const dR = Number.parseFloat(pool.dec_quantity);
  const rR = Number.parseFloat(pool.resource_quantity);
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" fontWeight="bold">
        {label}
      </Typography>
      <Stack direction="row" gap={3} mt={0.5}>
        <Box>
          <Typography variant="caption" color="text.secondary">
            DEC reserve
          </Typography>
          <Typography variant="body2" fontFamily="monospace">
            {fmt(dR, 0)}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            {pool.token_symbol} reserve
          </Typography>
          <Typography variant="body2" fontFamily="monospace">
            {fmt(rR, 0)}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Price
          </Typography>
          <Typography variant="body2" fontFamily="monospace">
            {(dR / rR).toFixed(4)} DEC/{pool.token_symbol}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

function HopTable({ hops }: { hops: HopDetail[] }) {
  if (hops.length === 0) return null;
  return (
    <Paper variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Step</TableCell>
            <TableCell align="right">Input</TableCell>
            <TableCell align="right">Output</TableCell>
            <TableCell align="right">Price impact</TableCell>
            <TableCell>Fee</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {hops.map((h) => (
            <TableRow key={h.label}>
              <TableCell>
                <Typography variant="caption">{h.label}</Typography>
              </TableCell>
              <TableCell align="right" sx={{ fontFamily: "monospace" }}>
                {fmt(h.inputAmount)} {h.inputSymbol}
              </TableCell>
              <TableCell align="right" sx={{ fontFamily: "monospace" }}>
                {fmt(h.outputAmount)} {h.outputSymbol}
              </TableCell>
              <TableCell align="right">
                <Typography
                  variant="caption"
                  sx={{ color: impactColor(h.priceImpact), fontWeight: "bold" }}
                >
                  {h.priceImpact.toFixed(2)}%
                </Typography>
              </TableCell>
              <TableCell>
                {h.feeApplied ? (
                  <Chip
                    label="10%"
                    size="small"
                    color="warning"
                    variant="outlined"
                  />
                ) : (
                  <Chip label="—" size="small" variant="outlined" />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}

export function PriceImpactCalculator({ data, timeStamp }: Props) {
  const resourceSymbols = data.map((p) => p.token_symbol);
  const allSymbols = ["DEC", ...resourceSymbols];

  const [fromSymbol, setFromSymbol] = useState(resourceSymbols[0] ?? "DEC");
  const [toSymbol, setToSymbol] = useState("DEC");
  const [payAmount, setPayAmount] = useState("");
  const [receiveAmount, setReceiveAmount] = useState("");
  const [direction, setDirection] = useState<Direction>("pay");

  const compute = useMemo((): SwapResult | null => {
    const amount = Number.parseFloat(
      direction === "pay" ? payAmount : receiveAmount
    );
    if (!amount || amount <= 0) return null;

    if (direction === "pay") {
      return computeForwardHops(data, fromSymbol, toSymbol, amount);
    }

    // "receive" mode: invert to find the required pay amount, then run forward for hop details
    const needed = computeInputForDesiredOutput(
      data,
      fromSymbol,
      toSymbol,
      amount
    );
    if (!Number.isFinite(needed)) return null;
    return computeForwardHops(data, fromSymbol, toSymbol, needed);
  }, [fromSymbol, toSymbol, payAmount, receiveAmount, direction, data]);

  const handlePayChange = (val: string) => {
    setPayAmount(val);
    setDirection("pay");
    setReceiveAmount("");
  };

  const handleReceiveChange = (val: string) => {
    setReceiveAmount(val);
    setDirection("receive");
    setPayAmount("");
  };

  const swapFromTo = () => {
    const prevFrom = fromSymbol;
    setFromSymbol(toSymbol);
    setToSymbol(prevFrom);
    setPayAmount("");
    setReceiveAmount("");
  };

  const fromPool = fromSymbol === "DEC" ? null : poolFor(data, fromSymbol);
  const toPool = toSymbol === "DEC" ? null : poolFor(data, toSymbol);

  return (
    <Box mt={3} maxWidth={700}>
      <Typography variant="h5" gutterBottom>
        Trade Hub Swap Calculator
      </Typography>

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={3}>
            {/* From / To selectors */}
            <Stack direction="row" gap={2} alignItems="center" flexWrap="wrap">
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>From</InputLabel>
                <Select
                  value={fromSymbol}
                  label="From"
                  onChange={(e) => {
                    setFromSymbol(e.target.value);
                    setPayAmount("");
                    setReceiveAmount("");
                  }}
                >
                  {allSymbols.map((s) => (
                    <MenuItem key={s} value={s}>
                      <Stack direction="row" gap={1} alignItems="center">
                        <ResourceIcon symbol={s} size={20} />
                        <span>{s}</span>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Tooltip title="Swap direction">
                <Box sx={{ cursor: "pointer" }} onClick={swapFromTo}>
                  <SwapHorizIcon />
                </Box>
              </Tooltip>

              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>To</InputLabel>
                <Select
                  value={toSymbol}
                  label="To"
                  onChange={(e) => {
                    setToSymbol(e.target.value);
                    setPayAmount("");
                    setReceiveAmount("");
                  }}
                >
                  {allSymbols.map((s) => (
                    <MenuItem key={s} value={s}>
                      <Stack direction="row" gap={1} alignItems="center">
                        <ResourceIcon symbol={s} size={20} />
                        <span>{s}</span>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            {/* Amount inputs */}
            <Stack direction="row" gap={2} alignItems="center" flexWrap="wrap">
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Pay ({fromSymbol})
                </Typography>
                <TextField
                  size="small"
                  type="number"
                  value={
                    direction === "pay"
                      ? payAmount
                      : (compute?.payResult?.toFixed(3) ?? "")
                  }
                  onChange={(e) => handlePayChange(e.target.value)}
                  slotProps={{
                    input: { inputProps: { inputMode: "decimal" } },
                  }}
                  sx={{ display: "block", mt: 0.5 }}
                  placeholder="0"
                />
              </Box>
              <Typography sx={{ mt: 2.5 }}>→</Typography>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Receive ({toSymbol})
                </Typography>
                <TextField
                  size="small"
                  type="number"
                  value={
                    direction === "receive"
                      ? receiveAmount
                      : (compute?.receiveResult?.toFixed(3) ?? "")
                  }
                  onChange={(e) => handleReceiveChange(e.target.value)}
                  slotProps={{
                    input: { inputProps: { inputMode: "decimal" } },
                  }}
                  sx={{ display: "block", mt: 0.5 }}
                  placeholder="0"
                />
              </Box>
            </Stack>

            {/* Hop breakdown */}
            {compute && compute.hops.length > 0 && (
              <>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" mb={1}>
                    Swap details
                  </Typography>
                  <HopTable hops={compute.hops} />
                </Box>
              </>
            )}

            {/* Pool state */}
            {(fromPool || toPool) && (
              <>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" mb={1}>
                    Pool state
                    {timeStamp && (
                      <Typography
                        component="span"
                        variant="caption"
                        color="text.secondary"
                        ml={1}
                      >
                        · updated{" "}
                        {new Date(parseInt(timeStamp)).toLocaleString()}
                      </Typography>
                    )}
                  </Typography>
                  <Stack gap={2}>
                    {fromPool && (
                      <PoolInfo
                        pool={fromPool}
                        label={`${fromSymbol}/DEC pool`}
                      />
                    )}
                    {toPool && toPool !== fromPool && (
                      <PoolInfo pool={toPool} label={`${toSymbol}/DEC pool`} />
                    )}
                  </Stack>
                </Box>
              </>
            )}

            {/* No result warning */}
            {(payAmount || receiveAmount) && !compute && (
              <Typography variant="body2" color="error">
                Pool cannot supply the requested amount.
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
