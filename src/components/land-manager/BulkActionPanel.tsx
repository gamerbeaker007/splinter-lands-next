"use client";

import HarvestConfirmDialog from "@/components/land-manager/HarvestConfirmDialog";
import MythicConfirmDialog from "@/components/land-manager/MythicConfirmDialog";
import { useHarvestAllAction } from "@/hooks/useHarvestAllAction";
import { useHarvestMythicsAction } from "@/hooks/useHarvestMythicsAction";
import { useMakeHarvestableAction } from "@/hooks/useMakeHarvestableAction";
import { useProcessResourcesAction } from "@/hooks/useProcessResourcesAction";
import { getFeeApplicableRegionNumbers } from "@/lib/backend/actions/land-manager/fee-actions";
import {
  DryRunResult,
  MakeHarvestableStrategy,
  POST_HARVEST_STRATEGY_LABELS,
  PostHarvestStrategy,
} from "@/types/landManager";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import {
  CheckCircleOutline,
  ContentCopy,
  Agriculture as HarvestIcon,
  AutoAwesome as MythicIcon,
  PlaylistAddCheck,
  Savings as SavingsIcon,
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
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface Props {
  username: string;
  regions: SplProductionOverviewRegion[];
  enabledRegions: number[];
  strategies: MakeHarvestableStrategy[];
  harvestAck: boolean;
  postHarvestStrategy: PostHarvestStrategy;
  mythicFeeAccepted: boolean;
  hasMythics: boolean;
  onSuccess?: () => void;
}

// ── Dry-run dialog ─────────────────────────────────────────────────────────

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

// ── Main component ─────────────────────────────────────────────────────────

export default function BulkActionPanel({
  username,
  regions,
  enabledRegions,
  strategies,
  harvestAck,
  postHarvestStrategy,
  mythicFeeAccepted,
  hasMythics,
  onSuccess,
}: Props) {
  const router = useRouter();
  const [dryRun, setDryRun] = useState<DryRunResult | null>(null);
  const [feeApplicableRegionNumbers, setFeeApplicableRegionNumbers] = useState<
    Set<number>
  >(new Set());

  useEffect(() => {
    if (!username) return;
    const regionNumbers = regions.map((r) => r.region_number);
    getFeeApplicableRegionNumbers(username, regionNumbers).then((nums) =>
      setFeeApplicableRegionNumbers(new Set(nums))
    );
  }, [username, regions]);

  const visibleRegions = regions.filter((r) =>
    enabledRegions.includes(r.region_number)
  );

  const afterSuccess = useCallback(() => {
    router.refresh();
    onSuccess?.();
  }, [router, onSuccess]);

  const harvest = useHarvestAllAction({
    username,
    visibleRegions,
    harvestAck,
    onSuccess: afterSuccess,
  });
  const makeHarvestable = useMakeHarvestableAction({
    username,
    visibleRegions,
    strategies,
    onSuccess: afterSuccess,
  });
  const processResources = useProcessResourcesAction({
    username,
    visibleRegions,
    postHarvestStrategy,
    onSuccess: afterSuccess,
  });
  const mythicHarvest = useHarvestMythicsAction({
    username,
    visibleRegions,
    mythicFeeAccepted,
    onSuccess: afterSuccess,
  });

  const anyBusy =
    harvest.busy ||
    makeHarvestable.busy ||
    processResources.busy ||
    mythicHarvest.busy;

  const activeResult =
    harvest.result ??
    makeHarvestable.result ??
    processResources.result ??
    mythicHarvest.result;

  const activeError =
    harvest.error ??
    makeHarvestable.error ??
    processResources.error ??
    mythicHarvest.error;

  function clearAll() {
    harvest.clearResult();
    harvest.clearError();
    makeHarvestable.clearResult();
    makeHarvestable.clearError();
    processResources.clearResult();
    processResources.clearError();
    mythicHarvest.clearResult();
    mythicHarvest.clearError();
  }

  async function run(
    action: { execute: (d: boolean) => Promise<DryRunResult | null> },
    isDryRun: boolean
  ) {
    const dr = await action.execute(isDryRun);
    if (dr) setDryRun(dr);
  }

  if (visibleRegions.length === 0) return null;

  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction="column" gap={0.5} flexWrap="wrap" alignItems="left">
        {/* Harvest All */}
        <Stack
          direction="row"
          gap={2}
          flexWrap="wrap"
          alignItems="center"
          mb={1.5}
        >
          <ButtonGroup size="small" disabled={anyBusy}>
            <Button
              variant="contained"
              color="success"
              startIcon={
                harvest.busy ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <HarvestIcon fontSize="small" />
                )
              }
              onClick={() => run(harvest, false)}
            >
              Harvest All
            </Button>
            <Tooltip title="Show planned operations without broadcasting">
              <Button
                variant="outlined"
                color="success"
                onClick={() => run(harvest, true)}
              >
                Dry Run
              </Button>
            </Tooltip>
          </ButtonGroup>
        </Stack>

        {/* Make All Harvestable */}
        <Stack
          direction="row"
          gap={2}
          flexWrap="wrap"
          alignItems="center"
          mb={1.5}
        >
          <ButtonGroup size="small" disabled={anyBusy}>
            <Button
              variant="contained"
              color="warning"
              startIcon={
                makeHarvestable.busy ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <PlaylistAddCheck fontSize="small" />
                )
              }
              onClick={() => run(makeHarvestable, false)}
            >
              Make All Harvestable
            </Button>
            <Tooltip title="Show planned operations without broadcasting">
              <Button
                variant="outlined"
                color="warning"
                onClick={() => run(makeHarvestable, true)}
              >
                Dry Run
              </Button>
            </Tooltip>
          </ButtonGroup>

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

        {/* Process Resources (post-harvest) */}
        <Stack
          direction="row"
          gap={2}
          flexWrap="wrap"
          alignItems="center"
          mb={1.5}
        >
          <ButtonGroup
            size="small"
            disabled={anyBusy || postHarvestStrategy === "accumulate"}
          >
            <Button
              variant="contained"
              color="secondary"
              startIcon={
                processResources.busy ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <SavingsIcon fontSize="small" />
                )
              }
              onClick={() => run(processResources, false)}
            >
              Process Resources
            </Button>
            <Tooltip title="Show planned operations without broadcasting">
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => run(processResources, true)}
              >
                Dry Run
              </Button>
            </Tooltip>
          </ButtonGroup>

          <Chip
            label={POST_HARVEST_STRATEGY_LABELS[postHarvestStrategy]}
            size="small"
            variant="outlined"
            sx={{ fontSize: "0.7rem" }}
          />
        </Stack>

        {/* Harvest Mythics (Keeps & Castles) */}
        <Stack
          direction="row"
          gap={2}
          flexWrap="wrap"
          alignItems="center"
          mb={1.5}
        >
          <ButtonGroup size="small" disabled={anyBusy || !hasMythics}>
            <Button
              variant="contained"
              color="secondary"
              startIcon={
                mythicHarvest.busy ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <MythicIcon fontSize="small" />
                )
              }
              onClick={() => run(mythicHarvest, false)}
            >
              Harvest Mythics
            </Button>
            <Tooltip title="Show planned operations without broadcasting">
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => run(mythicHarvest, true)}
              >
                Dry Run
              </Button>
            </Tooltip>
          </ButtonGroup>

          <Chip
            label="Keeps &amp; Castles"
            size="small"
            variant="outlined"
            sx={{ fontSize: "0.7rem" }}
          />
        </Stack>
      </Stack>

      {mythicHarvest.isVerifying && (
        <Alert
          severity="info"
          sx={{ mb: 1 }}
          icon={<CircularProgress size={16} />}
        >
          Verifying transactions on-chain… (up to 30s)
        </Alert>
      )}

      {activeResult?.success && (
        <Alert severity="success" onClose={clearAll} sx={{ mb: 1 }}>
          Broadcast successful
          {activeResult.txIds.length > 1
            ? ` (${activeResult.txIds.length} transactions)`
            : ""}{" "}
          · TX: {activeResult.txIds.at(-1) ?? "confirmed"}
        </Alert>
      )}

      {activeError && (
        <Alert severity="error" onClose={clearAll} sx={{ mb: 1 }}>
          {activeError}
        </Alert>
      )}

      {dryRun && (
        <DryRunDialog result={dryRun} onClose={() => setDryRun(null)} />
      )}

      <HarvestConfirmDialog
        open={harvest.showConfirm}
        username={username}
        visibleRegions={visibleRegions}
        feeApplicableRegionNumbers={feeApplicableRegionNumbers}
        onConfirm={harvest.onConfirm}
        onCancel={harvest.onCancelConfirm}
      />

      <MythicConfirmDialog
        open={mythicHarvest.showConfirm}
        visibleRegions={visibleRegions}
        feeApplicableRegionNumbers={feeApplicableRegionNumbers}
        onConfirm={mythicHarvest.onConfirm}
        onCancel={mythicHarvest.onCancelConfirm}
      />
    </Box>
  );
}
