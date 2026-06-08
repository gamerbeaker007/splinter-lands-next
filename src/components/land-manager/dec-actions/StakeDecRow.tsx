"use client";

import StakeDecDialog from "@/components/land-manager/dec-actions/StakeDecDialog";
import { useStakeDecAction } from "@/hooks/useStakeDecAction";
import { Bolt } from "@mui/icons-material";
import {
  Alert,
  Button,
  ButtonGroup,
  CircularProgress,
  Stack,
  Tooltip,
} from "@mui/material";
import { useEffect, useState } from "react";

interface Props {
  username: string;
  enabledRegions: number[];
  shortfallTotal: number;
  anyBusy: boolean;
  onBusyChange: (busy: boolean) => void;
  onSuccess: () => void;
}

function fmtInt(value: number): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export default function StakeDecRow({
  username,
  enabledRegions,
  shortfallTotal,
  anyBusy,
  onBusyChange,
  onSuccess,
}: Props) {
  const action = useStakeDecAction({ username, enabledRegions, onSuccess });
  const [dialogMode, setDialogMode] = useState<"dryrun" | "confirm" | null>(
    null
  );

  useEffect(() => {
    onBusyChange(action.busy);
  }, [action.busy, onBusyChange]);

  const disabled = anyBusy || shortfallTotal <= 0;

  const handleConfirm = async () => {
    await action.execute();
    // Close the confirm dialog only on a clean run; partial / failed
    // runs keep the dialog open so the user can see what landed.
    if (!action.error) setDialogMode(null);
  };

  const openDryRun = async () => {
    setDialogMode("dryrun");
    await action.preview();
  };
  const openConfirm = async () => {
    setDialogMode("confirm");
    await action.preview();
  };

  return (
    <>
      <Stack
        direction="row"
        gap={2}
        flexWrap="wrap"
        alignItems="center"
        mb={1.5}
      >
        <ButtonGroup size="small" disabled={disabled}>
          <Tooltip
            title={
              shortfallTotal <= 0
                ? "No DEC stake shortfall in enabled regions"
                : "Stake DEC into regions short of needed stake"
            }
          >
            <span>
              <Button
                variant="contained"
                color="info"
                startIcon={
                  action.busy ? (
                    <CircularProgress size={14} color="inherit" />
                  ) : (
                    <Bolt fontSize="small" />
                  )
                }
                disabled={disabled}
                onClick={openConfirm}
              >
                Stake DEC{" "}
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="Show planned stake without broadcasting">
            <span>
              <Button
                variant="outlined"
                color="info"
                disabled={disabled}
                onClick={openDryRun}
              >
                Dry Run
              </Button>
            </span>
          </Tooltip>
        </ButtonGroup>
      </Stack>

      {action.result?.success && (
        <Alert severity="success" onClose={action.clearResult} sx={{ mb: 1 }}>
          Staked {fmtInt(action.result.totalSucceeded)} DEC across{" "}
          {Object.keys(action.result.succeededByRegion).length} region
          {Object.keys(action.result.succeededByRegion).length === 1 ? "" : "s"}
          .
        </Alert>
      )}

      {action.result && !action.result.success && (
        <Alert severity="warning" onClose={action.clearResult} sx={{ mb: 1 }}>
          Partial run — staked {fmtInt(action.result.totalSucceeded)} DEC,
          failed/skipped {fmtInt(action.result.totalFailed)} DEC.
        </Alert>
      )}

      {action.error && (
        <Alert severity="error" onClose={action.clearError} sx={{ mb: 1 }}>
          {action.error}
        </Alert>
      )}

      {dialogMode && action.dryRun && (
        <StakeDecDialog
          plan={action.dryRun}
          decBalance={action.decBalance}
          busy={action.busy}
          mode={dialogMode}
          onConfirm={dialogMode === "confirm" ? handleConfirm : undefined}
          onClose={() => {
            setDialogMode(null);
            action.clearDryRun();
          }}
        />
      )}
    </>
  );
}
