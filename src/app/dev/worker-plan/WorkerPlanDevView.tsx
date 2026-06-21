"use client";

import { buildConfirmColumns } from "@/components/land-manager/rental/WorkerConfirmDialog";
import WorkerPlotTable, {
  WorkerPlotColumn,
} from "@/components/land-manager/rental/WorkerPlotTable";
import { BuyPlan, RentalPlan } from "@/types/landManager";
import {
  Alert,
  Box,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

// ─────────────────────────────────────────────────────────────────────────────

function fmtDec(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface Props {
  plan: RentalPlan | BuyPlan;
}

export default function WorkerPlanDevView({ plan }: Props) {
  const isRental = "rental_days" in plan;

  const columns: WorkerPlotColumn[] = isRental
    ? buildConfirmColumns("rent")
    : buildConfirmColumns("buy");

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} mb={2}>
        <Typography variant="h5" fontWeight="bold">
          {isRental ? "buildRentalPlan" : "buildBuyPlan"} — dev test
        </Typography>
        {isRental && (
          <Chip
            label={`${plan.rental_days ?? "per-listing"} rental days`}
            size="small"
            color="default"
            variant="outlined"
          />
        )}
      </Stack>

      <Typography
        variant="caption"
        color="text.secondary"
        display="block"
        mb={1}
      >
        Season source: {isRental ? plan.rental_days_source : "N/A"}
      </Typography>

      {/* Totals */}
      <Stack direction="row" spacing={3} mb={3}>
        {(
          [
            [
              "Plots processed",
              `${plan.totals.plots_with_picks} / ${plan.totals.plots_total}`,
            ],
            [
              "Slots filled",
              `${plan.totals.slots_filled} / ${plan.totals.slots_total}`,
            ],
            ["Total DEC", fmtDec(plan.totals.total_dec)],
          ] as [string, string][]
        ).map(([label, value]) => (
          <Paper key={label} variant="outlined" sx={{ p: 2, minWidth: 140 }}>
            <Typography variant="caption" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              {value}
            </Typography>
          </Paper>
        ))}
      </Stack>

      {/* Warnings */}
      {plan.warnings.length > 0 && (
        <Stack spacing={1} mb={3}>
          {plan.warnings.map((w, i) => (
            <Alert key={i} severity="warning" sx={{ py: 0.5 }}>
              {w}
            </Alert>
          ))}
        </Stack>
      )}

      <Divider sx={{ mb: 2 }} />
      {/* Plan table */}
      <WorkerPlotTable items={plan.items} columns={columns} rowsPerPage={25} />
    </Box>
  );
}
