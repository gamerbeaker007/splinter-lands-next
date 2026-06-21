"use client";

import RenewRentalsDialog from "@/components/land-manager/rental/RenewRentalsDialog";
import WorkerConfirmDialog from "@/components/land-manager/rental/WorkerConfirmDialog";
import type { AuthorityCoreStatus } from "@/hooks/useAuthorityStatusCore";
import { useRenewRentalsAction } from "@/hooks/useRenewRentalsAction";
import { useWorkerAction } from "@/hooks/useWorkerAction";
import { foilLabel } from "@/lib/utils/cardUtil";
import {
  BUY_STRATEGY_LABELS,
  BuyConfig,
  RENTAL_STRATEGY_LABELS,
  RentalConfig,
} from "@/types/landManager";
import { Autorenew, ShoppingCart, Storefront } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect } from "react";

interface Props {
  username: string;
  enabledRegions: number[];
  rental: RentalConfig;
  buy: BuyConfig;
  rentalAuthorityStatus?: AuthorityCoreStatus | null;
  purchaseAuthorityStatus?: AuthorityCoreStatus | null;
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
function RentalConfigChips({ rental }: Readonly<{ rental: RentalConfig }>) {
  const chips: { key: string; label: string }[] = [];

  chips.push(
    {
      key: "strategy",
      label: RENTAL_STRATEGY_LABELS[rental.strategy],
    },
    {
      key: "batch",
      label:
        rental.rental_batch_size === null
          ? "Batch: all plots"
          : `Batch: ${rental.rental_batch_size} plots`,
    }
  );

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
    <Stack direction="row" gap={0.5} flexWrap="wrap" alignItems="center" mb={1}>
      <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
        Rent config:
      </Typography>
      {chips.map(({ key, label }) => (
        <Chip key={key} label={label} size="small" variant="outlined" />
      ))}
    </Stack>
  );
}

/** Summarise the active buy config as compact chips for display. */
function BuyConfigChips({ buy }: Readonly<{ buy: BuyConfig }>) {
  const chips: { key: string; label: string }[] = [];

  chips.push(
    { key: "strategy", label: BUY_STRATEGY_LABELS[buy.strategy] },
    { key: "batch", label: `Batch: ${buy.buy_batch_size} plots` }
  );

  if (buy.max_total_dec > 0) {
    chips.push({
      key: "total",
      label: `≤ ${fmtDec(buy.max_total_dec)} DEC total`,
    });
  }
  if (buy.max_dec_per_worker > 0) {
    chips.push({
      key: "rate",
      label: `≤ ${fmtDec(buy.max_dec_per_worker)} DEC per worker`,
    });
  }
  if (buy.min_land_base_pp > 0) {
    chips.push({ key: "pp", label: `≥ ${buy.min_land_base_pp} PP per card` });
  }
  if (buy.min_foil > 0) {
    chips.push({ key: "foil", label: `${foilLabel(buy.min_foil)} Foil+` });
  }

  return (
    <Stack direction="row" gap={0.5} flexWrap="wrap" alignItems="center" mb={1}>
      <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
        Buy config:
      </Typography>
      {chips.map(({ key, label }) => (
        <Chip key={key} label={label} size="small" variant="outlined" />
      ))}
    </Stack>
  );
}

export default function WorkersRow({
  username,
  enabledRegions,
  rental,
  buy,
  rentalAuthorityStatus,
  purchaseAuthorityStatus,
  eligiblePlotCount,
  anyBusy,
  onBusyChange,
  onSuccess,
}: Readonly<Props>) {
  const rentAction = useWorkerAction({
    mode: "rent",
    username,
    rental,
    enabledRegions,
    eligiblePlotCount,
    onSuccess,
  });
  const buyAction = useWorkerAction({
    mode: "buy",
    username,
    buy,
    enabledRegions,
    eligiblePlotCount,
    onSuccess,
  });
  const renewAction = useRenewRentalsAction({ username, onSuccess });
  const rentalAuthority = rentalAuthorityStatus ?? null;
  const purchaseAuthority = purchaseAuthorityStatus ?? null;

  useEffect(() => {
    onBusyChange(rentAction.busy || buyAction.busy || renewAction.busy);
  }, [rentAction.busy, buyAction.busy, renewAction.busy, onBusyChange]);

  // ── Rent Workers ────────────────────────────────────────────────────────
  const blockedByRentalAuthority = Boolean(
    rentalAuthority &&
    !(rentalAuthority.serviceConfigured && rentalAuthority.authorized)
  );
  const rentDisabled =
    anyBusy || rentAction.eligiblePlotCount === 0 || blockedByRentalAuthority;

  const getRentTooltip = () => {
    if (!rentalAuthority) return "";
    if (!rentalAuthority.serviceConfigured)
      return "Server-side renting is not configured.";
    if (!rentalAuthority.authorized)
      return "Grant rental authority to the land-service account first (see the panel above).";
    if (rentAction.eligiblePlotCount === 0)
      return "No plots with empty worker slots";
    return "Show planned rentals without broadcasting";
  };

  // ── Buy Workers ───────────────────────────────────────────────────────────
  const blockedByPurchaseAuthority = Boolean(
    purchaseAuthority &&
    !(purchaseAuthority.serviceConfigured && purchaseAuthority.authorized)
  );
  const buyDisabled =
    anyBusy || buyAction.eligiblePlotCount === 0 || blockedByPurchaseAuthority;

  const getBuyTooltip = () => {
    if (!purchaseAuthority) return "";
    if (!purchaseAuthority.serviceConfigured)
      return "Server-side buying is not configured.";
    if (!purchaseAuthority.authorized)
      return "Grant purchase authority to the land-service account first (see the panel above).";
    if (buyAction.eligiblePlotCount === 0)
      return "No plots with empty worker slots";
    return "Show planned purchases without broadcasting";
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
        <Tooltip title={getRentTooltip()}>
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

      {/* Active rental config summaries */}
      <RentalConfigChips rental={rental} />

      {/* Rent Workers feedback */}
      {rentAction.result?.success && (
        <Alert
          severity="success"
          onClose={rentAction.clearResult}
          sx={{ mb: 1 }}
        >
          Rented {rentAction.result.count} card
          {rentAction.result.count === 1 ? "" : "s"} · staked{" "}
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
          Rented {rentAction.result.count} card
          {rentAction.result.count === 1 ? "" : "s"} but staking did not
          complete · {fmtDec(rentAction.result.totalDec)} DEC spent
        </Alert>
      )}

      {/* Rent Workers feedback */}
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
          {renewAction.result.renewedCount === 1 ? "" : "s"} for{" "}
          {fmtDec(renewAction.result.totalDec)} DEC.
        </Alert>
      )}
      {renewAction.error && (
        <Alert severity="error" onClose={renewAction.clearError} sx={{ mb: 1 }}>
          {renewAction.error}
        </Alert>
      )}

      <Divider sx={{ my: 1 }} />

      {/* Buy Empty Workers */}
      <Stack
        direction="row"
        gap={2}
        flexWrap="wrap"
        alignItems="center"
        mb={0.5}
      >
        <Tooltip title={getBuyTooltip()}>
          <span>
            <Button
              size="small"
              variant="contained"
              color="secondary"
              disabled={buyDisabled}
              startIcon={
                buyAction.busy ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <ShoppingCart fontSize="small" />
                )
              }
              onClick={() => buyAction.prepareExecution()}
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
                  Find Buy Workers
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ fontSize: "0.65rem", opacity: 0.85, lineHeight: 1.2 }}
                >
                  buy cards for empty worker slots
                </Typography>
              </Box>
            </Button>
          </span>
        </Tooltip>
      </Stack>

      {/* Active buy config summaries */}
      <BuyConfigChips buy={buy} />
      {/* Buy Workers feedback */}
      {buyAction.result?.success && (
        <Alert
          severity="success"
          onClose={buyAction.clearResult}
          sx={{ mb: 1 }}
        >
          Bought {buyAction.result.count} card
          {buyAction.result.count === 1 ? "" : "s"} · staked{" "}
          {buyAction.result.stakedCount} · spent{" "}
          {fmtDec(buyAction.result.totalDec)} DEC ($
          {buyAction.result.totalUsd.toFixed(2)})
        </Alert>
      )}
      {buyAction.result && !buyAction.result.success && (
        <Alert
          severity="warning"
          onClose={buyAction.clearResult}
          sx={{ mb: 1 }}
        >
          Bought {buyAction.result.count} card
          {buyAction.result.count === 1 ? "" : "s"} but staking did not complete
          · {fmtDec(buyAction.result.totalDec)} DEC spent
        </Alert>
      )}
      {buyAction.error && (
        <Alert severity="error" onClose={buyAction.clearError} sx={{ mb: 1 }}>
          {buyAction.error}
        </Alert>
      )}

      <Divider sx={{ my: 1 }} />

      {/* Rent Workers dialogs */}
      {rentAction.executionPlan && (
        <WorkerConfirmDialog
          exec={rentAction.executionPlan}
          busy={rentAction.busy}
          decBalance={rentAction.decBalance}
          onConfirm={() => rentAction.execute()}
          onCancel={rentAction.clearExecutionPlan}
        />
      )}

      {/* Buy Workers dialog */}
      {buyAction.executionPlan && (
        <WorkerConfirmDialog
          exec={buyAction.executionPlan}
          busy={buyAction.busy}
          decBalance={buyAction.decBalance}
          onConfirm={() => buyAction.execute()}
          onCancel={buyAction.clearExecutionPlan}
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
