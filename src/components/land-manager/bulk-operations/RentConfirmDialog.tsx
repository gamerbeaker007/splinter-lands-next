"use client";

import CardPicksCell from "@/components/land-manager/bulk-operations/CardPicksCell";
import RentalPlotTable, {
  RentalPlotColumn,
} from "@/components/land-manager/bulk-operations/RentalPlotTable";
import { RentalExecutionPlan } from "@/lib/backend/actions/land-manager/rental-actions";
import { parseLandStatsResources } from "@/lib/filters";
import { RentalPlanItem } from "@/types/landManager";
import { WarningAmber } from "@mui/icons-material";
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";

interface Props {
  exec: RentalExecutionPlan;
  busy: boolean;
  decBalance: number | null;
  onConfirm: () => void;
  onCancel: () => void;
}

function fmtDec(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function buildConfirmColumns(): RentalPlotColumn[] {
  return [
    {
      header: "Plot",
      render: (item) => (
        <Typography variant="caption" fontFamily="monospace" noWrap>
          R{item.plot.region_number} · T{item.plot.tract_number} · P
          {item.plot.plot_number}
        </Typography>
      ),
    },
    {
      header: "Resource",
      render: (item) => (
        <Typography variant="caption">
          {item.plot.resource_symbol ??
            parseLandStatsResources(item.plot.land_stats)[0] ??
            "—"}
        </Typography>
      ),
    },
    {
      header: "Worksite",
      render: (item) => (
        <Typography variant="caption">
          {item.plot.worksite_type ?? "—"}
        </Typography>
      ),
    },
    {
      header: "DEC",
      align: "right",
      render: (item) => (
        <Typography variant="caption">{fmtDec(item.plot_total_dec)}</Typography>
      ),
    },
    {
      header: "Workers",
      render: (item: RentalPlanItem) => <CardPicksCell picks={item.picks} />,
    },
  ];
}

export default function RentConfirmDialog({
  exec,
  busy,
  decBalance,
  onConfirm,
  onCancel,
}: Props) {
  const { plan, emptySlotsByDeed } = exec;
  const { totals } = plan;

  const slotShortages = plan.items.filter(
    (item) =>
      item.picks.length > 0 &&
      (emptySlotsByDeed[item.plot.deed_uid]?.length ?? 0) < item.picks.length
  );

  const noPicks = totals.slots_filled === 0;
  const itemsWithPicks = plan.items.filter((i) => i.picks.length > 0);
  const columns = buildConfirmColumns();
  const insufficientDec =
    decBalance != null && totals.total_dec > 0 && decBalance < totals.total_dec;

  return (
    <Dialog open onClose={busy ? undefined : onCancel} maxWidth="lg" fullWidth>
      <DialogTitle>Confirm — Rent Empty Workers</DialogTitle>
      <DialogContent dividers>
        <Stack direction="row" gap={1} flexWrap="wrap" mb={2}>
          <Chip
            label={`${totals.plots_with_picks}/${totals.plots_total} plots`}
            size="small"
            variant="outlined"
          />
          <Chip
            label={`${totals.slots_filled}/${totals.slots_total} slots`}
            size="small"
            variant="outlined"
          />
          <Chip
            label={`${fmtDec(totals.total_dec)} DEC total`}
            size="small"
            color="primary"
          />
          {decBalance != null && (
            <Chip
              label={`${fmtDec(decBalance)} DEC available`}
              size="small"
              color={insufficientDec ? "error" : "default"}
              variant="outlined"
            />
          )}
        </Stack>

        {noPicks ? (
          <Alert severity="info">
            No cards selected for rental. Check your config or biome filters.
          </Alert>
        ) : (
          <>
            {insufficientDec && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Insufficient DEC — this rental needs{" "}
                <strong>{fmtDec(totals.total_dec)} DEC</strong> but your balance
                is <strong>{fmtDec(decBalance!)} DEC</strong>. Top up{" "}
                <strong>{fmtDec(totals.total_dec - decBalance!)} DEC</strong>{" "}
                before confirming.
              </Alert>
            )}

            <Alert severity="warning" icon={<WarningAmber />} sx={{ mb: 2 }}>
              You are about to spend{" "}
              <strong>{fmtDec(totals.total_dec)} DEC</strong> to rent{" "}
              <strong>{totals.slots_filled}</strong> card
              {totals.slots_filled === 1 ? "" : "s"} for{" "}
              <strong>
                {plan.rental_days ?? "?"}{" "}
                {plan.rental_days === 1 ? "day" : "days"}
              </strong>
              {plan.rental_days_source && (
                <Typography
                  variant="caption"
                  display="block"
                  color="text.secondary"
                >
                  ({plan.rental_days_source})
                </Typography>
              )}
              Season rentals cannot be cancelled — the full amount is taken
              immediately and distributed to sellers.
            </Alert>

            {slotShortages.length > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {slotShortages.length} plot
                {slotShortages.length === 1 ? "" : "s"} will have rented cards
                but not enough free slots to stake them — those plots will be
                skipped during staking and you can stake the cards manually.
              </Alert>
            )}

            <RentalPlotTable items={itemsWithPicks} columns={columns} />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="info"
          disabled={busy || noPicks || insufficientDec}
          onClick={onConfirm}
          startIcon={
            busy ? <CircularProgress size={14} color="inherit" /> : null
          }
        >
          {busy ? "Renting…" : "Confirm Rent and Stake"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
