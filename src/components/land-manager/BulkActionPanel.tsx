"use client";

import {
  getBulkRegionData,
  getDecBalance,
  getLandPools,
} from "@/lib/backend/actions/land-manager/overview-actions";
import {
  BroadcastResult,
  broadcastOperations,
} from "@/lib/frontend/splBroadcast";
import {
  canHarvestRegion,
  effectiveBalance,
} from "@/lib/shared/landManagerUtils";
import { buildRegionHarvestOps } from "@/lib/frontend/harvestOps";
import { buildMakeHarvestableOps } from "@/lib/frontend/makeHarvestableOps";
import { MakeHarvestableStrategy } from "@/types/landManager";
import {
  SplHarvestableResource,
  SplProductionOverviewRegion,
} from "@/types/spl/landManager";
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
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  username: string;
  regions: SplProductionOverviewRegion[];
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

function buildHarvestAllOps(
  visibleRegions: SplProductionOverviewRegion[],
  username: string,
  harvestableMap: Record<string, SplHarvestableResource[]>,
  balancesMap: Record<string, Record<string, number>>,
  pools: SplLandPool[]
): { ops: [string, object][]; log: string[] } {
  const ops: [string, object][] = [];
  const log: string[] = [];

  for (const region of visibleRegions) {
    const harvestable = harvestableMap[region.region_uid] ?? [];
    const balance = balancesMap[region.region_uid] ?? {
      GRAIN: 0,
      WOOD: 0,
      STONE: 0,
      IRON: 0,
      AURA: 0,
    };

    if (!canHarvestRegion(harvestable, balance)) {
      log.push(`[${region.name}] skip — cannot afford harvest`);
      continue;
    }

    const { ops: regionOps, log: regionLog } = buildRegionHarvestOps(
      username,
      region,
      harvestable,
      pools
    );
    ops.push(...regionOps);
    log.push(...regionLog);
  }

  return { ops, log };
}

// buildMakeHarvestableOps lives in @/lib/frontend/makeHarvestableOps

// ── Main component ─────────────────────────────────────────────────────────

export default function BulkActionPanel({
  username,
  regions,
  enabledRegions,
  strategies,
}: Props) {
  const router = useRouter();
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
      const adjustedBalances = Object.fromEntries(
        visibleRegions.map((r) => [
          r.region_uid,
          effectiveBalance(
            balances[r.region_uid] ?? {
              GRAIN: 0,
              WOOD: 0,
              STONE: 0,
              IRON: 0,
              AURA: 0,
            },
            r
          ),
        ])
      );
      const { ops, log } = await buildHarvestAllOps(
        visibleRegions,
        username,
        harvestable,
        adjustedBalances,
        pools
      );

      if (isDryRun) {
        setDryRun({ title: "Dry Run — Harvest All", log, ops });
      } else if (ops.length === 0) {
        setBroadcastError("No regions are ready to harvest.");
      } else {
        const res = await broadcastOperations(username, ops);
        setBroadcastResult(res);
        if (res.success) router.refresh();
        else setBroadcastError(res.error ?? "Broadcast failed");
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
      const [{ harvestable, balances }, dec, { pools }] = await Promise.all([
        getBulkRegionData(visibleRegions.map((r) => r.region_uid)),
        getDecBalance(username),
        getLandPools(),
      ]);
      const adjustedBalances = Object.fromEntries(
        visibleRegions.map((r) => [
          r.region_uid,
          effectiveBalance(
            balances[r.region_uid] ?? {
              GRAIN: 0,
              WOOD: 0,
              STONE: 0,
              IRON: 0,
              AURA: 0,
            },
            r
          ),
        ])
      );
      const { ops, log } = buildMakeHarvestableOps(
        visibleRegions,
        username,
        harvestable,
        adjustedBalances,
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
        if (res.success) router.refresh();
        else setBroadcastError(res.error ?? "Broadcast failed");
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
