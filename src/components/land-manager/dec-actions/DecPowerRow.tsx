"use client";

import DecPowerDialog from "@/components/land-manager/dec-actions/DecPowerDialog";
import { DEC_POWER_VARIANTS } from "@/components/land-manager/dec-actions/decPowerVariant";
import { useDecPowerAction } from "@/hooks/useDecPowerAction";
import { DecPowerDirection } from "@/lib/backend/actions/land-manager/dec-power-actions";
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
  direction: DecPowerDirection;
  /** Global amount available to act on (shortfall for stake, excess for unstake). */
  availableTotal: number;
  anyBusy: boolean;
  onBusyChange: (busy: boolean) => void;
  onSuccess: () => void;
}

function fmtInt(value: number): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export default function DecPowerRow({
  username,
  enabledRegions,
  direction,
  availableTotal,
  anyBusy,
  onBusyChange,
  onSuccess,
}: Props) {
  const variant = DEC_POWER_VARIANTS[direction];
  const Icon = variant.icon;
  const action = useDecPowerAction({
    username,
    enabledRegions,
    direction,
    onSuccess,
  });
  const [dialogMode, setDialogMode] = useState<"dryrun" | "confirm" | null>(
    null
  );

  useEffect(() => {
    onBusyChange(action.busy);
  }, [action.busy, onBusyChange]);

  const disabled = anyBusy || availableTotal <= 0;

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

  const succeededRegionCount = action.result
    ? Object.keys(action.result.succeededByRegion).length
    : 0;

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
              availableTotal <= 0
                ? variant.disabledTooltip
                : variant.enabledTooltip
            }
          >
            <span>
              <Button
                variant="contained"
                color={variant.color}
                startIcon={
                  action.busy ? (
                    <CircularProgress size={14} color="inherit" />
                  ) : (
                    <Icon fontSize="small" />
                  )
                }
                disabled={disabled}
                onClick={openConfirm}
              >
                {variant.verb} DEC{" "}
              </Button>
            </span>
          </Tooltip>
          <Tooltip
            title={`Show planned ${variant.verb.toLowerCase()} without broadcasting`}
          >
            <span>
              <Button
                variant="outlined"
                color={variant.color}
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
          {variant.pastVerb} {fmtInt(action.result.totalSucceeded)} DEC across{" "}
          {succeededRegionCount} region
          {succeededRegionCount === 1 ? "" : "s"}.
        </Alert>
      )}

      {action.result && !action.result.success && (
        <Alert severity="warning" onClose={action.clearResult} sx={{ mb: 1 }}>
          Partial run — {variant.pastVerb.toLowerCase()}{" "}
          {fmtInt(action.result.totalSucceeded)} DEC, failed/skipped{" "}
          {fmtInt(action.result.totalFailed)} DEC.
        </Alert>
      )}

      {action.error && (
        <Alert severity="error" onClose={action.clearError} sx={{ mb: 1 }}>
          {action.error}
        </Alert>
      )}

      {dialogMode && action.dryRun && (
        <DecPowerDialog
          direction={direction}
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
