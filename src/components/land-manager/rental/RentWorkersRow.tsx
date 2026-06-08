"use client";

import RenewRentalsDialog from "@/components/land-manager/rental/RenewRentalsDialog";
import RentConfirmDialog from "@/components/land-manager/rental/RentConfirmDialog";
import { useRenewRentalsAction } from "@/hooks/useRenewRentalsAction";
import { useRentEmptyWorkersAction } from "@/hooks/useRentEmptyWorkersAction";
import type { RentalAuthorityStatus } from "@/lib/backend/actions/land-manager/authority-actions";
import { foilLabel } from "@/lib/utils/cardUtil";
import { RENTAL_STRATEGY_LABELS, RentalConfig } from "@/types/landManager";
import { Autorenew, Storefront } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  Tooltip,
  Typography,
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

/** Summarise the active rental config as compact chips for display. */
function RentalConfigChips({ rental }: { rental: RentalConfig }) {
  const chips: { key: string; label: string }[] = [];

  chips.push({
    key: "strategy",
    label: RENTAL_STRATEGY_LABELS[rental.strategy],
  });

  chips.push({
    key: "batch",
    label:
      rental.rental_batch_size !== null
        ? `Batch: ${rental.rental_batch_size} plots`
        : "Batch: all plots",
  });

  if (rental.max_total_dec > 0) {
    chips.push({
      key: "total",
      label: `≤ ${fmtDec(rental.max_total_dec)} DEC total per plot`,
    });
  }
  if (rental.max_dec_per_day_per_worker > 0) {
    chips.push({
      key: "rate",
      label: `≤ ${fmtDec(rental.max_dec_per_day_per_worker)} DEC/day per worker`,
    });
  }
  if (rental.min_land_base_pp > 0) {
    chips.push({
      key: "pp",
      label: `≥ ${rental.min_land_base_pp} PP per card`,
    });
  }
  if (rental.min_foil > 0) {
    chips.push({ key: "foil", label: `${foilLabel(rental.min_foil)} Foil+` });
  }

  return (
    <Stack direction="row" gap={0.5} flexWrap="wrap" alignItems="center">
      <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
        Config:
      </Typography>
      {chips.map(({ key, label }) => (
        <Chip key={key} label={label} size="small" variant="outlined" />
      ))}
    </Stack>
  );
}

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
        mb={0.5}
      >
        {/* Rent Empty Workers — single action button (plan is reviewed in confirm dialog) */}
        <Tooltip title={blockedByAuthority ? getRentTooltip() : ""}>
          <span>
            <Button
              size="small"
              variant="contained"
              color="info"
              disabled={rentDisabled}
              startIcon={
                rentAction.busy ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <Storefront fontSize="small" />
                )
              }
              onClick={() => rentAction.prepareExecution()}
              sx={{ textTransform: "none" }}
            >
              <Box
                component="span"
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  lineHeight: 1.2,
                }}
              >
                <Typography
                  variant="caption"
                  fontWeight="bold"
                  lineHeight={1.3}
                >
                  Find Rental Workers
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ fontSize: "0.65rem", opacity: 0.85, lineHeight: 1.2 }}
                >
                  for empty worker slots on plot
                </Typography>
              </Box>
            </Button>
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

      {/* Active config summary */}
      <Box mb={1.5}>
        <RentalConfigChips rental={rental} />
      </Box>

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
