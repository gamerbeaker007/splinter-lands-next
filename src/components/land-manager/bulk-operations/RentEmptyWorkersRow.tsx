"use client";

import RentConfirmDialog from "@/components/land-manager/bulk-operations/RentConfirmDialog";
import RentDryRunDialog from "@/components/land-manager/bulk-operations/RentDryRunDialog";
import { useRentEmptyWorkersAction } from "@/hooks/useRentEmptyWorkersAction";
import type { RentalAuthorityStatus } from "@/lib/backend/actions/land-manager/authority-actions";
import { RentalConfig } from "@/types/landManager";
import { Storefront } from "@mui/icons-material";
import {
  Alert,
  Button,
  ButtonGroup,
  CircularProgress,
  Stack,
  Tooltip,
} from "@mui/material";
import { useEffect } from "react";

interface Props {
  username: string;
  enabledRegions: number[];
  rental: RentalConfig;
  authorityStatus?: RentalAuthorityStatus | null;
  anyBusy: boolean;
  onBusyChange: (busy: boolean) => void;
  onSuccess: () => void;
}

function fmtDec(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function RentEmptyWorkersRow({
  username,
  enabledRegions,
  rental,
  authorityStatus,
  anyBusy,
  onBusyChange,
  onSuccess,
}: Props) {
  const action = useRentEmptyWorkersAction({
    username,
    rental,
    enabledRegions,
    onSuccess,
  });
  const authority = authorityStatus ?? null;

  useEffect(() => {
    onBusyChange(action.busy);
  }, [action.busy, onBusyChange]);

  // Renting is server-side only — the configured land-service account signs
  // sm_market_rent on the player's behalf. The buttons are only usable when
  // the service is configured AND the player has granted rental authority.
  const blockedByAuthority = Boolean(
    authority && !(authority.serviceConfigured && authority.authorized)
  );

  const rentDisabled =
    anyBusy || action.eligiblePlotCount === 0 || blockedByAuthority;

  const getRentTooltip = () => {
    if (!authority) return "";

    if (!authority.serviceConfigured) {
      return "Server-side renting is not configured.";
    }

    if (!authority.authorized) {
      return "Grant rental authority to the land-service account first (see the panel above).";
    }

    if (action.eligiblePlotCount === 0) {
      return "No plots with empty worker slots";
    }

    return "Show planned rentals without broadcasting";
  };

  const rentTooltip = getRentTooltip();

  return (
    <>
      <Stack
        direction="row"
        gap={2}
        flexWrap="wrap"
        alignItems="center"
        mb={1.5}
      >
        <Tooltip title={blockedByAuthority ? rentTooltip : ""}>
          <span>
            <ButtonGroup size="small" disabled={rentDisabled}>
              <Button
                variant="contained"
                color="info"
                startIcon={
                  action.busy ? (
                    <CircularProgress size={14} color="inherit" />
                  ) : (
                    <Storefront fontSize="small" />
                  )
                }
                onClick={() => action.prepareExecution()}
              >
                Rent Empty Workers
              </Button>
              <span>
                <Button
                  variant="outlined"
                  color="info"
                  disabled={rentDisabled}
                  onClick={() => action.preview()}
                >
                  Dry Run
                </Button>
              </span>
            </ButtonGroup>
          </span>
        </Tooltip>
      </Stack>

      {action.result?.success && (
        <Alert severity="success" onClose={action.clearResult} sx={{ mb: 1 }}>
          Rented {action.result.rentedCount} card
          {action.result.rentedCount === 1 ? "" : "s"} · staked{" "}
          {action.result.stakedCount} · spent {fmtDec(action.result.totalDec)}{" "}
          DEC
        </Alert>
      )}

      {action.result && !action.result.success && (
        <Alert severity="warning" onClose={action.clearResult} sx={{ mb: 1 }}>
          Rented {action.result.rentedCount} card
          {action.result.rentedCount === 1 ? "" : "s"} but staking did not
          complete · {fmtDec(action.result.totalDec)} DEC spent
        </Alert>
      )}

      {action.error && (
        <Alert severity="error" onClose={action.clearError} sx={{ mb: 1 }}>
          {action.error}
        </Alert>
      )}

      {action.dryRunPlan && (
        <RentDryRunDialog
          plan={action.dryRunPlan}
          onClose={action.clearDryRunPlan}
        />
      )}

      {action.executionPlan && (
        <RentConfirmDialog
          exec={action.executionPlan}
          busy={action.busy}
          onConfirm={() => action.execute()}
          onCancel={action.clearExecutionPlan}
        />
      )}
    </>
  );
}
