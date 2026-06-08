"use client";

import RentalPlotTable, {
  RentalPlotColumn,
} from "@/components/land-manager/rental/RentalPlotTable";
import { buildConfirmColumns } from "@/components/land-manager/rental/RentConfirmDialog";
import { RentalPlan } from "@/types/landManager";
import {
  Alert,
  Box,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

const COLUMNS: RentalPlotColumn[] = buildConfirmColumns();

// ─────────────────────────────────────────────────────────────────────────────

function fmtDec(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface Props {
  plan: RentalPlan;
}

export default function RentalPlanDevView({ plan }: Props) {
  const { totals, warnings, rental_days, rental_days_source } = plan;
  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} mb={2}>
        <Typography variant="h5" fontWeight="bold">
          buildRentalPlan — dev test
        </Typography>
        <Chip
          label={`${rental_days ?? "per-listing"} rental days`}
          size="small"
          color="default"
          variant="outlined"
        />
      </Stack>

      <Typography
        variant="caption"
        color="text.secondary"
        display="block"
        mb={1}
      >
        Season source: {rental_days_source}
      </Typography>

      {/* Totals */}
      <Stack direction="row" spacing={3} mb={3}>
        {(
          [
            [
              "Plots processed",
              `${totals.plots_with_picks} / ${totals.plots_total}`,
            ],
            ["Slots filled", `${totals.slots_filled} / ${totals.slots_total}`],
            ["Total DEC", fmtDec(totals.total_dec)],
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
      {warnings.length > 0 && (
        <Stack spacing={1} mb={3}>
          {warnings.map((w, i) => (
            <Alert key={i} severity="warning" sx={{ py: 0.5 }}>
              {w}
            </Alert>
          ))}
        </Stack>
      )}

      <Divider sx={{ mb: 2 }} />
      {/* Plan table */}
      <RentalPlotTable items={plan.items} columns={COLUMNS} rowsPerPage={25} />
    </Box>
  );
}
