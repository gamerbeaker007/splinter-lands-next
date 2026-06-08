"use client";

import { RenewRentalPlan } from "@/types/landManager";
import { WarningAmber } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

interface Props {
  plan: RenewRentalPlan;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function fmtDec(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function RenewRentalsDialog({
  plan,
  busy,
  onConfirm,
  onCancel,
}: Props) {
  const nothingToRenew = plan.items.length === 0;
  const skippedCount =
    plan.skipped_already_renewed +
    plan.skipped_no_market_id +
    plan.skipped_cancel_tx +
    plan.skipped_not_on_land;

  return (
    <Dialog open onClose={busy ? undefined : onCancel} maxWidth="md" fullWidth>
      <DialogTitle>Renew Rentals</DialogTitle>
      <DialogContent dividers>
        {/* Season info */}
        <Stack direction="row" gap={1} flexWrap="wrap" mb={2}>
          <Chip
            label={`${plan.season_days_remaining.toFixed(1)}d left in season`}
            size="small"
            variant="outlined"
            color={plan.season_days_remaining < 7 ? "warning" : "default"}
          />
          {plan.next_season_end && (
            <Chip
              label={`Next EOS: ${fmtDate(plan.next_season_end)}`}
              size="small"
              variant="outlined"
            />
          )}
          <Chip
            label={
              plan.land_renters_only
                ? "Land renters only: ON"
                : "Land renters only: OFF"
            }
            size="small"
            variant="outlined"
            color={plan.land_renters_only ? "primary" : "default"}
          />
        </Stack>

        {/* Skipped info */}
        {skippedCount > 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {plan.skipped_already_renewed > 0 && (
              <Typography variant="caption" display="block">
                {plan.skipped_already_renewed} card
                {plan.skipped_already_renewed !== 1 ? "s" : ""} already renewed
                (rental extends past current season end — skipped).
              </Typography>
            )}
            {plan.skipped_cancel_tx > 0 && (
              <Typography variant="caption" display="block">
                {plan.skipped_cancel_tx} card
                {plan.skipped_cancel_tx !== 1 ? "s" : ""} pending cancellation
                (cancel_tx set — cannot be renewed).
              </Typography>
            )}
            {plan.skipped_no_market_id > 0 && (
              <Typography variant="caption" display="block">
                {plan.skipped_no_market_id} card
                {plan.skipped_no_market_id !== 1 ? "s" : ""} skipped (no
                market_id — cannot identify listing).
              </Typography>
            )}
            {plan.skipped_not_on_land > 0 && (
              <Typography variant="caption" display="block">
                {plan.skipped_not_on_land} card
                {plan.skipped_not_on_land !== 1 ? "s" : ""} skipped — rented but
                not staked on a land plot (land renters only is ON).
              </Typography>
            )}
          </Alert>
        )}

        {nothingToRenew ? (
          <Alert severity="info">
            No rentals need renewing right now. All active rentals already
            extend past the current season end.
          </Alert>
        ) : (
          <>
            {/* Cost summary */}
            <Stack
              direction="row"
              gap={1}
              flexWrap="wrap"
              alignItems="center"
              mb={2}
            >
              <Chip
                label={`${plan.items.length} card${plan.items.length !== 1 ? "s" : ""} to renew`}
                size="small"
                color="primary"
                variant="outlined"
              />
              <Chip
                label={`${fmtDec(plan.total_dec)} DEC total`}
                size="small"
                color="primary"
              />
              <Chip
                label={`Balance: ${fmtDec(plan.dec_balance)} DEC`}
                size="small"
                color={plan.sufficient_balance ? "success" : "error"}
                variant="outlined"
              />
            </Stack>

            {!plan.sufficient_balance && (
              <Alert severity="error" icon={<WarningAmber />} sx={{ mb: 2 }}>
                Insufficient DEC balance. You need{" "}
                <strong>{fmtDec(plan.total_dec)} DEC</strong> but only have{" "}
                <strong>{fmtDec(plan.dec_balance)} DEC</strong>. Top up before
                proceeding.
              </Alert>
            )}

            <Alert severity="warning" icon={<WarningAmber />} sx={{ mb: 2 }}>
              You are about to spend{" "}
              <strong>{fmtDec(plan.total_dec)} DEC</strong> renewing{" "}
              {plan.items.length} rental
              {plan.items.length !== 1 ? "s" : ""}.
            </Alert>

            <Divider sx={{ mb: 2 }} />

            <TableContainer component={Box}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Owner</TableCell>
                    <TableCell align="right">DEC/day</TableCell>
                    <TableCell align="right">Ext. days</TableCell>
                    <TableCell align="right">Total DEC</TableCell>
                    <TableCell>Current end</TableCell>
                    <TableCell>Plot</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {plan.items.map((item) => (
                    <TableRow key={item.market_id} hover>
                      <TableCell>
                        <Typography
                          variant="caption"
                          sx={{ fontFamily: "monospace" }}
                        >
                          {item.owner}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="caption">
                          {fmtDec(item.dec_per_day)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="caption">
                          {item.renewal_days}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="caption" fontWeight="bold">
                          {fmtDec(item.total_dec)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {fmtDate(item.current_rental_end)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          #{item.stake_plot}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        {!nothingToRenew && (
          <Button
            variant="contained"
            color="warning"
            disabled={busy || !plan.sufficient_balance}
            onClick={onConfirm}
          >
            {busy
              ? "Broadcasting…"
              : `Renew ${plan.items.length} rental${plan.items.length !== 1 ? "s" : ""}`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
