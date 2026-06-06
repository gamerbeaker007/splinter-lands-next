"use client";

import RentalPlotTable, {
  RentalPlotColumn,
} from "@/components/land-manager/rental/RentalPlotTable";
import { buildConfirmColumns } from "@/components/land-manager/rental/RentConfirmDialog";
import { RentalConfig, RentalPlan } from "@/types/landManager";
import {
  Alert,
  Box,
  Chip,
  Divider,
  Link,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

// ── Quick-launch link (all params explicit for easy editing in URL bar) ──────
const DEFAULT_LINK =
  "/dev/rental-plan?plots=14&batch=5&max_dec=0&max_per_worker=0&min_pp=0&min_foil=0";

// ── Same columns as RentDryRunDialog ─────────────────────────────────────────

function fmtDec(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const COLUMNS: RentalPlotColumn[] = buildConfirmColumns();

// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  plan: RentalPlan;
  config: RentalConfig;
}

export default function RentalPlanDevView({ plan, config }: Props) {
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

      {/* Quick-launch link */}
      <Box mb={3}>
        <Chip
          suppressHydrationWarning
          component={Link}
          href={DEFAULT_LINK}
          label="Run test (all defaults)"
          size="small"
          variant="outlined"
          color="primary"
          clickable
          sx={{ fontFamily: "monospace", fontSize: "0.72rem" }}
        />
      </Box>

      {/* Config summary */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle2" mb={1}>
          Config used
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {(
            [
              ["strategy", config.strategy],
              ["max_total_dec", config.max_total_dec || "unlimited"],
              [
                "max_dec_per_day_per_worker",
                config.max_dec_per_day_per_worker || "unlimited",
              ],
              ["min_land_base_pp", config.min_land_base_pp || "none"],
              [
                "min_foil",
                config.min_foil === 0
                  ? "Regular+"
                  : config.min_foil === 1
                    ? "Gold+"
                    : config.min_foil,
              ],
              ["rental_batch_size", config.rental_batch_size ?? "all"],
            ] as [string, string | number][]
          ).map(([k, v]) => (
            <Chip
              key={k}
              label={`${k}: ${v}`}
              size="small"
              variant="outlined"
            />
          ))}
        </Stack>
      </Paper>

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

      <Typography
        variant="caption"
        color="text.secondary"
        mt={3}
        display="block"
      >
        Reload the page to re-fetch live market data. Tweak via URL params:
        ?max_dec=200&min_pp=50&max_per_worker=5&min_foil=0&batch=3&plots=3
      </Typography>
    </Box>
  );
}
