"use client";

import MythicConfirmDialog from "@/components/land-manager/MythicConfirmDialog";
import { useHarvestMythicsAction } from "@/hooks/useHarvestMythicsAction";
import { DryRunResult } from "@/types/landManager";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import { AutoAwesome as MythicIcon } from "@mui/icons-material";
import {
  Alert,
  Button,
  ButtonGroup,
  Chip,
  CircularProgress,
  Stack,
  Tooltip,
} from "@mui/material";
import { useEffect } from "react";

interface Props {
  username: string;
  visibleRegions: SplProductionOverviewRegion[];
  mythicFeeAccepted: boolean;
  hasMythics: boolean;
  anyBusy: boolean;
  feeApplicableRegionNumbers: Set<number>;
  onBusyChange: (busy: boolean) => void;
  onDryRun: (result: DryRunResult) => void;
  onSuccess: () => void;
}

export default function HarvestMythicsRow({
  username,
  visibleRegions,
  mythicFeeAccepted,
  hasMythics,
  anyBusy,
  feeApplicableRegionNumbers,
  onBusyChange,
  onDryRun,
  onSuccess,
}: Props) {
  const action = useHarvestMythicsAction({
    username,
    visibleRegions,
    mythicFeeAccepted,
    onSuccess,
  });

  useEffect(() => {
    onBusyChange(action.busy);
  }, [action.busy, onBusyChange]);

  async function run(isDryRun: boolean) {
    const dr = await action.execute(isDryRun);
    if (dr) onDryRun(dr);
  }

  return (
    <>
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
              action.busy ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <MythicIcon fontSize="small" />
              )
            }
            onClick={() => run(false)}
          >
            Harvest Mythics
          </Button>
          <Tooltip title="Show planned operations without broadcasting">
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => run(true)}
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

      {action.isVerifying && (
        <Alert
          severity="info"
          sx={{ mb: 1 }}
          icon={<CircularProgress size={16} />}
        >
          Verifying transactions on-chain… (up to 30s)
        </Alert>
      )}

      {action.result?.success && (
        <Alert severity="success" onClose={action.clearResult} sx={{ mb: 1 }}>
          Broadcast successful
          {action.result.txIds.length > 1
            ? ` (${action.result.txIds.length} transactions)`
            : ""}{" "}
          · TX: {action.result.txIds.at(-1) ?? "confirmed"}
        </Alert>
      )}

      {action.error && (
        <Alert severity="error" onClose={action.clearError} sx={{ mb: 1 }}>
          {action.error}
        </Alert>
      )}

      <MythicConfirmDialog
        open={action.showConfirm}
        visibleRegions={visibleRegions}
        feeApplicableRegionNumbers={feeApplicableRegionNumbers}
        onConfirm={action.onConfirm}
        onCancel={action.onCancelConfirm}
      />
    </>
  );
}
