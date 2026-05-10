"use client";

import {
  getBulkRegionData,
  getDecBalance,
  getLandPools,
} from "@/lib/backend/actions/land-manager/overview-actions";
import {
  BroadcastResult,
  broadcastOperations,
  buildBuyWithDecOp,
  buildFeeTransferOp,
  buildHarvestOp,
  buildSwapTokensOp,
} from "@/lib/frontend/splBroadcast";
import {
  aggregateCosts,
  canHarvestRegion,
  computeDecNeededForResource,
  computeEffectiveBalances,
  computeSwapAmounts,
  CostEntry,
} from "@/lib/shared/landManagerUtils";
import {
  MakeHarvestableStrategy,
  ProductionOverviewRegion,
  RegionResourceBalance,
  SERVICE_FEE_PCT,
  SERVICE_FEE_RECIPIENT,
  SERVICE_FEE_RECIPIENT_REGION,
  TRADE_HUB_FEE_PCT,
} from "@/types/landManager";
import {
  Agriculture as HarvestIcon,
  CheckCircleOutline,
  ContentCopy,
  PlaylistAddCheck,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  ButtonGroup,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import { SplLandPool } from "@/types/spl/landPools";
import { HarvestableResource } from "@/types/landManager";
import { useState } from "react";

interface Props {
  username: string;
  regions: ProductionOverviewRegion[];
  enabledRegions: number[];
  strategies: MakeHarvestableStrategy[];
}

interface DryRunResult {
  title: string;
  log: string[];
  ops: [string, object][];
}

// ── Types ──────────────────────────────────────────────────────────────────

function DryRunDialog({
  result,
  onClose,
}: {
  result: DryRunResult;
  onClose: () => void;
}) {
  const json = JSON.stringify(result.ops, null, 2);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{result.title}</DialogTitle>
      <DialogContent dividers>
        {/* Human readable log */}
        <Typography variant="subtitle2" gutterBottom>
          Plan ({result.ops.length} operation
          {result.ops.length !== 1 ? "s" : ""})
        </Typography>
        <Paper
          variant="outlined"
          sx={{
            p: 1.5,
            mb: 2,
            fontFamily: "monospace",
            fontSize: "0.75rem",
            whiteSpace: "pre-wrap",
            bgcolor: "action.hover",
            maxHeight: 200,
            overflow: "auto",
          }}
        >
          {result.log.join("\n") || "(nothing to do)"}
        </Paper>

        {/* Raw ops JSON */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          mb={0.5}
        >
          <Typography variant="subtitle2">Operations JSON</Typography>
          <Tooltip title={copied ? "Copied!" : "Copy to clipboard"}>
            <IconButton size="small" onClick={copy}>
              {copied ? (
                <CheckCircleOutline fontSize="small" color="success" />
              ) : (
                <ContentCopy fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        </Stack>
        <Paper
          variant="outlined"
          sx={{
            p: 1.5,
            fontFamily: "monospace",
            fontSize: "0.72rem",
            whiteSpace: "pre",
            bgcolor: "action.hover",
            maxHeight: 320,
            overflow: "auto",
          }}
        >
          {json}
        </Paper>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Core logic: build harvest-all ops ─────────────────────────────────────

async function buildHarvestAllOps(
  visibleRegions: ProductionOverviewRegion[],
  username: string,
  harvestableMap: Record<string, HarvestableResource[]>,
  balancesMap: Record<string, RegionResourceBalance>,
  pools: SplLandPool[]
): Promise<{ ops: [string, object][]; log: string[] }> {
  const ops: [string, object][] = [];
  const log: string[] = [];
  const applyFee =
    username.toLowerCase() !== SERVICE_FEE_RECIPIENT.toLowerCase();

  for (const region of visibleRegions) {
    const harvestable = harvestableMap[region.region_uid] ?? [];
    const balance = balancesMap[region.region_uid] ?? {
      grain: 0,
      wood: 0,
      stone: 0,
      iron: 0,
      aura: 0,
    };

    if (!canHarvestRegion(harvestable, balance)) {
      log.push(`[${region.name}] skip — cannot afford harvest`);
      continue;
    }

    log.push(`[${region.name}] harvest`);
    ops.push(buildHarvestOp(username, region.region_uid));

    if (applyFee) {
      for (const resource of harvestable) {
        const feeAmount = parseFloat(
          ((resource.amount_claimable * SERVICE_FEE_PCT) / 100).toFixed(3)
        );
        if (feeAmount <= 0) continue;

        const { out_amount_1, out_amount_2 } = computeSwapAmounts(
          pools,
          resource.token_symbol,
          resource.token_symbol,
          feeAmount
        );
        ops.push(
          buildFeeTransferOp(
            username,
            region.region_uid,
            SERVICE_FEE_RECIPIENT_REGION,
            resource.token_symbol,
            feeAmount,
            out_amount_1,
            out_amount_2
          )
        );
        log.push(
          `  fee: ${feeAmount} ${resource.token_symbol} → ${out_amount_2} to ${SERVICE_FEE_RECIPIENT}`
        );
      }
    }
  }

  return { ops, log };
}

// ── Core logic: build make-harvestable ops ────────────────────────────────

async function buildMakeHarvestableOps(
  visibleRegions: ProductionOverviewRegion[],
  username: string,
  harvestableMap: Record<string, HarvestableResource[]>,
  balancesMap: Record<string, RegionResourceBalance>,
  strategies: MakeHarvestableStrategy[],
  initialDecBalance: number,
  pools: SplLandPool[]
): Promise<{ ops: [string, object][]; log: string[] }> {
  const ops: [string, object][] = [];
  const log: string[] = [];

  const EMPTY_BALANCE: RegionResourceBalance = {
    grain: 0,
    wood: 0,
    stone: 0,
    iron: 0,
    aura: 0,
  };

  // Mutable working copies of effective balances per region
  const working: Record<string, Record<string, number>> = {};
  for (const r of visibleRegions) {
    working[r.region_uid] = computeEffectiveBalances(
      balancesMap[r.region_uid] ?? EMPTY_BALANCE,
      harvestableMap[r.region_uid] ?? []
    );
  }

  // Pre-computed costs per region
  const costsMap: Record<string, CostEntry[]> = {};
  for (const r of visibleRegions) {
    costsMap[r.region_uid] = aggregateCosts(harvestableMap[r.region_uid] ?? []);
  }

  let workingDec = initialDecBalance;

  for (const region of visibleRegions) {
    const costs = costsMap[region.region_uid];
    if (costs.length === 0) continue; // nothing to harvest

    const already = costs.every(
      ({ symbol, amount }) =>
        (working[region.region_uid][symbol] ?? 0) >= amount
    );
    if (already) continue; // already harvestable

    const missing = costs.filter(
      ({ symbol, amount }) => (working[region.region_uid][symbol] ?? 0) < amount
    );

    log.push(
      `\n[${region.name}] needs: ${missing.map((m) => `${(m.amount - (working[region.region_uid][m.symbol] ?? 0)).toFixed(0)} ${m.symbol}`).join(", ")}`
    );

    for (const cost of missing) {
      const deficit =
        cost.amount - (working[region.region_uid][cost.symbol] ?? 0);
      let resolved = false;

      for (const strategy of strategies) {
        if (resolved) break;

        // ── Strategy: transfer ──────────────────────────────────────────
        if (strategy === "transfer") {
          // Find donor region with highest surplus of the needed symbol
          let bestDonor: ProductionOverviewRegion | null = null;
          let bestSurplus = 0;

          for (const donor of visibleRegions) {
            if (donor.region_uid === region.region_uid) continue;
            const donorCost =
              costsMap[donor.region_uid].find((c) => c.symbol === cost.symbol)
                ?.amount ?? 0;
            const donorHas = working[donor.region_uid][cost.symbol] ?? 0;
            const surplus = donorHas - donorCost;
            if (surplus > bestSurplus) {
              bestDonor = donor;
              bestSurplus = surplus;
            }
          }

          // Need in_amount so that after fee, receiver gets >= deficit
          const inAmount = parseFloat(
            (deficit / (1 - TRADE_HUB_FEE_PCT / 100)).toFixed(3)
          );

          if (bestDonor && bestSurplus >= inAmount) {
            const { out_amount_1, out_amount_2 } = computeSwapAmounts(
              pools,
              cost.symbol,
              cost.symbol,
              inAmount
            );
            ops.push(
              buildSwapTokensOp(
                username,
                bestDonor.region_uid,
                region.region_uid,
                cost.symbol,
                cost.symbol,
                inAmount,
                out_amount_1,
                out_amount_2
              )
            );
            working[bestDonor.region_uid][cost.symbol] =
              (working[bestDonor.region_uid][cost.symbol] ?? 0) - inAmount;
            working[region.region_uid][cost.symbol] =
              (working[region.region_uid][cost.symbol] ?? 0) + out_amount_2;
            log.push(
              `  ✓ Transfer: ${inAmount} ${cost.symbol} from ${bestDonor.name} → receive ${out_amount_2.toFixed(3)} in ${region.name}`
            );
            resolved = true;
          } else {
            log.push(
              bestDonor
                ? `  - Transfer: ${bestDonor.name} surplus ${bestSurplus.toFixed(0)} ${cost.symbol} < needed ${inAmount.toFixed(0)}`
                : `  - Transfer: no region with surplus ${cost.symbol}`
            );
          }
        }

        // ── Strategy: swap ──────────────────────────────────────────────
        else if (strategy === "swap") {
          // Find resource with highest surplus across all enabled regions
          let bestSource: ProductionOverviewRegion | null = null;
          let bestSymbol = "";
          let bestSurplus = 0;

          for (const source of visibleRegions) {
            for (const sym of ["GRAIN", "WOOD", "STONE", "IRON"]) {
              if (sym === cost.symbol) continue;
              const srcCost =
                costsMap[source.region_uid].find((c) => c.symbol === sym)
                  ?.amount ?? 0;
              const surplus = (working[source.region_uid][sym] ?? 0) - srcCost;
              if (surplus > bestSurplus) {
                bestSource = source;
                bestSymbol = sym;
                bestSurplus = surplus;
              }
            }
          }

          if (bestSource && bestSymbol && bestSurplus > 0) {
            const inAmount = parseFloat(bestSurplus.toFixed(3));
            const { out_amount_1, out_amount_2 } = computeSwapAmounts(
              pools,
              bestSymbol,
              cost.symbol,
              inAmount
            );
            ops.push(
              buildSwapTokensOp(
                username,
                bestSource.region_uid,
                region.region_uid,
                bestSymbol,
                cost.symbol,
                inAmount,
                out_amount_1,
                out_amount_2
              )
            );
            working[bestSource.region_uid][bestSymbol] =
              (working[bestSource.region_uid][bestSymbol] ?? 0) - inAmount;
            working[region.region_uid][cost.symbol] =
              (working[region.region_uid][cost.symbol] ?? 0) + out_amount_2;
            if (out_amount_2 >= deficit) {
              log.push(
                `  ✓ Swap: ${inAmount} ${bestSymbol} from ${bestSource.name} → ${out_amount_2.toFixed(3)} ${cost.symbol} in ${region.name}`
              );
              resolved = true;
            } else {
              log.push(
                `  ~ Swap partial: ${inAmount} ${bestSymbol} → ${out_amount_2.toFixed(3)} ${cost.symbol} (still short ${(deficit - out_amount_2).toFixed(0)})`
              );
            }
          } else {
            log.push(`  - Swap: no surplus resource found`);
          }
        }

        // ── Strategy: buy with DEC ──────────────────────────────────────
        else if (strategy === "buy_dec") {
          if (workingDec <= 0) {
            log.push(`  - Buy DEC: balance is 0`);
            continue;
          }

          const decNeeded = computeDecNeededForResource(
            pools,
            cost.symbol,
            deficit
          );
          if (!isFinite(decNeeded)) {
            log.push(
              `  - Buy DEC: pool cannot supply ${deficit.toFixed(0)} ${cost.symbol}`
            );
            continue;
          }
          const decAmount = parseFloat(
            Math.min(workingDec, decNeeded).toFixed(3)
          );
          // If we can't afford the full deficit, buy what we can
          const { out_amount_2: resourceOut } = computeSwapAmounts(
            pools,
            "DEC",
            cost.symbol,
            decAmount
          );
          const sharesOut = parseFloat(resourceOut.toFixed(3));

          ops.push(
            buildBuyWithDecOp(
              username,
              region.region_uid,
              decAmount,
              sharesOut,
              cost.symbol
            )
          );
          workingDec -= decAmount;
          working[region.region_uid][cost.symbol] =
            (working[region.region_uid][cost.symbol] ?? 0) + sharesOut;
          if (sharesOut >= deficit) {
            log.push(
              `  ✓ Buy: ${decAmount} DEC → ${sharesOut} ${cost.symbol} in ${region.name}`
            );
            resolved = true;
          } else {
            log.push(
              `  ~ Buy partial: ${decAmount} DEC → ${sharesOut} ${cost.symbol} (still short ${(deficit - sharesOut).toFixed(0)})`
            );
          }
        }
      }

      if (!resolved) {
        log.push(
          `  ✗ Could not resolve ${deficit.toFixed(0)} ${cost.symbol} shortage with available strategies`
        );
      }
    }
  }

  return { ops, log };
}

// ── Main component ─────────────────────────────────────────────────────────

export default function BulkActionPanel({
  username,
  regions,
  enabledRegions,
  strategies,
}: Props) {
  const [dryRun, setDryRun] = useState<DryRunResult | null>(null);
  const [busy, setBusy] = useState<"harvest" | "make" | null>(null);
  const [broadcastResult, setBroadcastResult] =
    useState<BroadcastResult | null>(null);
  const [broadcastError, setBroadcastError] = useState<string | null>(null);

  const visibleRegions = regions.filter((r) =>
    enabledRegions.includes(r.region_number)
  );

  // ── Harvest All ───────────────────────────────────────────────────────

  const handleHarvestAll = async (isDryRun: boolean) => {
    setBusy("harvest");
    setBroadcastResult(null);
    setBroadcastError(null);
    try {
      const [{ harvestable, balances }, { pools }] = await Promise.all([
        getBulkRegionData(visibleRegions.map((r) => r.region_uid)),
        getLandPools(),
      ]);
      const { ops, log } = await buildHarvestAllOps(
        visibleRegions,
        username,
        harvestable,
        balances,
        pools
      );

      if (isDryRun) {
        setDryRun({ title: "Dry Run — Harvest All", log, ops });
      } else if (ops.length === 0) {
        setBroadcastError("No regions are ready to harvest.");
      } else {
        const res = await broadcastOperations(username, ops);
        setBroadcastResult(res);
        if (!res.success) setBroadcastError(res.error ?? "Broadcast failed");
      }
    } catch (err) {
      setBroadcastError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setBusy(null);
    }
  };

  // ── Make All Harvestable ──────────────────────────────────────────────

  const handleMakeHarvestable = async (isDryRun: boolean) => {
    setBusy("make");
    setBroadcastResult(null);
    setBroadcastError(null);
    try {
      const [{ harvestable, balances }, { dec }, { pools }] = await Promise.all(
        [
          getBulkRegionData(visibleRegions.map((r) => r.region_uid)),
          getDecBalance(),
          getLandPools(),
        ]
      );
      const { ops, log } = await buildMakeHarvestableOps(
        visibleRegions,
        username,
        harvestable,
        balances,
        strategies,
        dec,
        pools
      );

      if (isDryRun) {
        setDryRun({ title: "Dry Run — Make All Harvestable", log, ops });
      } else if (ops.length === 0) {
        setBroadcastError(
          "All regions are already harvestable (or no strategies could help)."
        );
      } else {
        const res = await broadcastOperations(username, ops);
        setBroadcastResult(res);
        if (!res.success) setBroadcastError(res.error ?? "Broadcast failed");
      }
    } catch (err) {
      setBroadcastError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setBusy(null);
    }
  };

  if (visibleRegions.length === 0) return null;

  return (
    <Box sx={{ mb: 3 }}>
      {/* Action buttons */}
      <Stack
        direction="row"
        gap={2}
        flexWrap="wrap"
        alignItems="center"
        mb={1.5}
      >
        {/* Harvest All */}
        <ButtonGroup size="small" disabled={busy !== null}>
          <Button
            variant="contained"
            color="success"
            startIcon={
              busy === "harvest" ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <HarvestIcon fontSize="small" />
              )
            }
            onClick={() => handleHarvestAll(false)}
          >
            Harvest All
          </Button>
          <Tooltip title="Show planned operations without broadcasting">
            <Button
              variant="outlined"
              color="success"
              onClick={() => handleHarvestAll(true)}
            >
              Dry Run
            </Button>
          </Tooltip>
        </ButtonGroup>

        {/* Make All Harvestable */}
        <ButtonGroup size="small" disabled={busy !== null}>
          <Button
            variant="contained"
            color="warning"
            startIcon={
              busy === "make" ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <PlaylistAddCheck fontSize="small" />
              )
            }
            onClick={() => handleMakeHarvestable(false)}
          >
            Make All Harvestable
          </Button>
          <Tooltip title="Show planned operations without broadcasting">
            <Button
              variant="outlined"
              color="warning"
              onClick={() => handleMakeHarvestable(true)}
            >
              Dry Run
            </Button>
          </Tooltip>
        </ButtonGroup>

        {/* Strategy indicator */}
        <Stack direction="row" gap={0.5} flexWrap="wrap">
          {strategies.map((s, i) => (
            <Chip
              key={s}
              label={`${i + 1}. ${s}`}
              size="small"
              variant="outlined"
              sx={{ fontSize: "0.7rem" }}
            />
          ))}
        </Stack>
      </Stack>
      {/* Feedback */}
      {broadcastResult?.success && (
        <Alert
          severity="success"
          onClose={() => setBroadcastResult(null)}
          sx={{ mb: 1 }}
        >
          Broadcast successful · TX: {broadcastResult.txId ?? "confirmed"}
        </Alert>
      )}
      {broadcastError && (
        <Alert
          severity="error"
          onClose={() => setBroadcastError(null)}
          sx={{ mb: 1 }}
        >
          {broadcastError}
        </Alert>
      )}

      {/* Dry run result dialog */}
      {dryRun && (
        <DryRunDialog result={dryRun} onClose={() => setDryRun(null)} />
      )}
    </Box>
  );
}
