"use client";

import RenewRentalsDialog from "@/components/land-manager/bulk-operations/RenewRentalsDialog";
import RentConfirmDialog from "@/components/land-manager/bulk-operations/RentConfirmDialog";
import RentDryRunDialog from "@/components/land-manager/bulk-operations/RentDryRunDialog";
import { useRenewRentalsAction } from "@/hooks/useRenewRentalsAction";
import { useRentEmptyWorkersAction } from "@/hooks/useRentEmptyWorkersAction";
import type { RentalAuthorityStatus } from "@/lib/backend/actions/land-manager/authority-actions";
import { RentalConfig } from "@/types/landManager";
import { Autorenew, Storefront } from "@mui/icons-material";
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
  eligiblePlotCount?: number | null;
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

export default function RentWorkersRow({
  username,
  enabledRegions,
  rental,
  authorityStatus,
  eligiblePlotCount,
  anyBusy,
  onBusyChange,
  onSuccess,
}: Props) {
  const rentAction = useRentEmptyWorkersAction({
    username,
    rental,
    enabledRegions,
    eligiblePlotCount,
    onSuccess,
  });
  const renewAction = useRenewRentalsAction({ username, onSuccess });
  const authority = authorityStatus ?? null;

  useEffect(() => {
    onBusyChange(rentAction.busy || renewAction.busy);
  }, [rentAction.busy, renewAction.busy, onBusyChange]);

  // ── Rent Workers ────────────────────────────────────────────────────────
  const blockedByAuthority = Boolean(
    authority && !(authority.serviceConfigured && authority.authorized)
  );
  const rentDisabled =
    anyBusy || rentAction.eligiblePlotCount === 0 || blockedByAuthority;

  const getRentTooltip = () => {
    if (!authority) return "";
    if (!authority.serviceConfigured)
      return "Server-side renting is not configured.";
    if (!authority.authorized)
      return "Grant rental authority to the land-service account first (see the panel above).";
    if (rentAction.eligiblePlotCount === 0)
      return "No plots with empty worker slots";
    return "Show planned rentals without broadcasting";
  };

  // ── Renew Rentals ───────────────────────────────────────────────────────
  const notYetTime = renewAction.seasonDaysRemaining >= 7;
  const renewDisabled = anyBusy || !renewAction.eligible || notYetTime;

  const getRenewTooltip = () => {
    if (notYetTime)
      return `Renewal opens when < 7 days remain in the season (${renewAction.seasonDaysRemaining.toFixed(1)}d left)`;
    if (!renewAction.eligible) return "No active rentals to renew";
    return "";
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
        {/* Rent Empty Workers */}
        <Tooltip title={blockedByAuthority ? getRentTooltip() : ""}>
          <span>
            <ButtonGroup size="small" disabled={rentDisabled}>
              <Button
                variant="contained"
                color="info"
                startIcon={
                  rentAction.busy ? (
                    <CircularProgress size={14} color="inherit" />
                  ) : (
                    <Storefront fontSize="small" />
                  )
                }
                onClick={() => rentAction.prepareExecution()}
              >
                Rent Workers
              </Button>
              <Button
                variant="outlined"
                color="info"
                disabled={rentDisabled}
                onClick={() => rentAction.preview()}
              >
                Dry Run
              </Button>
            </ButtonGroup>
          </span>
        </Tooltip>

        {/* Renew Rentals */}
        <Tooltip title={getRenewTooltip()}>
          <span>
            <Button
              size="small"
              variant="outlined"
              color="warning"
              disabled={renewDisabled}
              startIcon={
                renewAction.busy ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <Autorenew fontSize="small" />
                )
              }
              onClick={() => renewAction.open()}
            >
              Renew Rentals
            </Button>
          </span>
        </Tooltip>
      </Stack>

      {/* Rent Workers feedback */}
      {rentAction.result?.success && (
        <Alert
          severity="success"
          onClose={rentAction.clearResult}
          sx={{ mb: 1 }}
        >
          Rented {rentAction.result.rentedCount} card
          {rentAction.result.rentedCount === 1 ? "" : "s"} · staked{" "}
          {rentAction.result.stakedCount} · spent{" "}
          {fmtDec(rentAction.result.totalDec)} DEC
        </Alert>
      )}
      {rentAction.result && !rentAction.result.success && (
        <Alert
          severity="warning"
          onClose={rentAction.clearResult}
          sx={{ mb: 1 }}
        >
          Rented {rentAction.result.rentedCount} card
          {rentAction.result.rentedCount === 1 ? "" : "s"} but staking did not
          complete · {fmtDec(rentAction.result.totalDec)} DEC spent
        </Alert>
      )}
      {rentAction.error && (
        <Alert severity="error" onClose={rentAction.clearError} sx={{ mb: 1 }}>
          {rentAction.error}
        </Alert>
      )}

      {/* Renew Rentals feedback */}
      {renewAction.result && (
        <Alert
          severity="success"
          onClose={renewAction.clearResult}
          sx={{ mb: 1 }}
        >
          Renewed {renewAction.result.renewedCount} rental
          {renewAction.result.renewedCount !== 1 ? "s" : ""} for{" "}
          {fmtDec(renewAction.result.totalDec)} DEC.
        </Alert>
      )}
      {renewAction.error && (
        <Alert severity="error" onClose={renewAction.clearError} sx={{ mb: 1 }}>
          {renewAction.error}
        </Alert>
      )}

      {/* Rent Workers dialogs */}
      {rentAction.dryRunPlan && (
        <RentDryRunDialog
          plan={rentAction.dryRunPlan}
          decBalance={rentAction.decBalance}
          onClose={rentAction.clearDryRunPlan}
        />
      )}
      {rentAction.executionPlan && (
        <RentConfirmDialog
          exec={rentAction.executionPlan}
          busy={rentAction.busy}
          decBalance={rentAction.decBalance}
          onConfirm={() => rentAction.execute()}
          onCancel={rentAction.clearExecutionPlan}
        />
      )}

      {/* Renew Rentals dialog — confirm before broadcasting */}
      {renewAction.plan && (
        <RenewRentalsDialog
          plan={renewAction.plan}
          busy={renewAction.busy}
          onConfirm={() => renewAction.execute(renewAction.plan!)}
          onCancel={renewAction.clearPlan}
        />
      )}
    </>
  );
}
