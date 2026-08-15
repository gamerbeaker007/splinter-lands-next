"use client";

import { useDecPowerAction } from "@/hooks/useDecPowerAction";
import { DecPowerDirection } from "@/lib/backend/actions/land-manager/dec-power-actions";
import { Alert, Button, CircularProgress, Stack, Tooltip } from "@mui/material";
import { useEffect, useState } from "react";
import DecPowerDialog from "./DecPowerDialog";
import { DEC_POWER_VARIANTS } from "./decPowerVariant";

interface Props {
  username: string;
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
    direction,
    onSuccess,
  });
  const [planOpen, setPlanOpen] = useState(false);

  useEffect(() => {
    onBusyChange(action.busy);
  }, [action.busy, onBusyChange]);

  const disabled = anyBusy || availableTotal <= 0;

  const handleConfirm = async () => {
    await action.execute();
    // Close only on a clean run; partial / failed runs keep the dialog open so
    // the user can see what landed.
    if (!action.error) setPlanOpen(false);
  };

  // One button, one path: build the plan, show it, and broadcast only on
  // confirmation.
  const openPlan = async () => {
    setPlanOpen(true);
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
        <Tooltip
          title={
            availableTotal <= 0
              ? variant.disabledTooltip
              : `${variant.enabledTooltip} — shows the plan for confirmation first`
          }
        >
          <span>
            <Button
              size="small"
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
              onClick={openPlan}
            >
              {variant.verb} DEC…
            </Button>
          </span>
        </Tooltip>
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

      {planOpen && action.plan && (
        <DecPowerDialog
          direction={direction}
          plan={action.plan}
          decBalance={action.decBalance}
          busy={action.busy}
          onConfirm={handleConfirm}
          onClose={() => {
            setPlanOpen(false);
            action.clearPlan();
          }}
        />
      )}
    </>
  );
}
