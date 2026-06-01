"use client";

import CardPicksCell from "@/components/land-manager/bulk-operations/CardPicksCell";
import RentalPlotTable, {
  RentalPlotColumn,
} from "@/components/land-manager/bulk-operations/RentalPlotTable";
import { parseLandStatsResources } from "@/lib/filters";
import { RentalPlan, RentalPlanItem } from "@/types/landManager";
import { WarningAmber } from "@mui/icons-material";
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";

interface Props {
  plan: RentalPlan;
  decBalance: number | null;
  onClose: () => void;
}

function fmtDec(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const COLUMNS: RentalPlotColumn[] = [
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
    header: "Filled / Empty",
    align: "right",
    render: (item) => (
      <Typography variant="caption">
        {item.slots_filled} / {item.plot.empty_slots}
      </Typography>
    ),
  },
  {
    header: "DEC",
    align: "right",
    render: (item) => (
      <Typography variant="caption">
        {item.plot_total_dec > 0 ? fmtDec(item.plot_total_dec) : "—"}
      </Typography>
    ),
  },
  {
    header: "Cards",
    render: (item: RentalPlanItem) =>
      item.picks.length > 0 ? (
        <CardPicksCell picks={item.picks} />
      ) : (
        <Chip
          icon={<WarningAmber sx={{ fontSize: 12 }} />}
          label={item.skip_reason ?? "skipped"}
          size="small"
          color="warning"
          variant="outlined"
          sx={{ fontSize: "0.65rem", height: 18 }}
        />
      ),
  },
];

export default function RentDryRunDialog({ plan, decBalance, onClose }: Props) {
  const { totals } = plan;
  const insufficientDec =
    decBalance != null && totals.total_dec > 0 && decBalance < totals.total_dec;

  return (
    <Dialog open onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Dry Run — Rent Empty Workers</DialogTitle>
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

        {insufficientDec && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Insufficient DEC — this plan needs{" "}
            <strong>{fmtDec(totals.total_dec)} DEC</strong> but your balance is{" "}
            <strong>{fmtDec(decBalance!)} DEC</strong>. Top up{" "}
            <strong>{fmtDec(totals.total_dec - decBalance!)} DEC</strong> before
            renting.
          </Alert>
        )}

        {plan.warnings.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Stack gap={0.25}>
              {plan.warnings.map((w, i) => (
                <Typography key={i} variant="caption">
                  {w}
                </Typography>
              ))}
            </Stack>
          </Alert>
        )}

        {plan.items.length === 0 ? (
          <Typography variant="body2" color="text.disabled">
            No eligible plots.
          </Typography>
        ) : (
          <RentalPlotTable items={plan.items} columns={COLUMNS} />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
