"use client";

import { RentalConfig, RentalPlan } from "@/types/landManager";
import {
  Box,
  Button,
  Chip,
  Link,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useState, useTransition } from "react";
import RentalPlanDevView from "./RentalPlanDevView";

// ── Quick-launch link (all params explicit for easy editing in URL bar) ──────
const DEFAULT_LINK =
  "/dev/rental-plan?plots=14&batch=5&max_dec=0&max_per_worker=0&min_pp=0&min_foil=0";

// ── Same columns as RentDryRunDialog ─────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  config: RentalConfig;
  execute: () => Promise<RentalPlan>;
}

export default function RentalPlanAction({ config, execute }: Props) {
  const [plan, setPlan] = useState<RentalPlan | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
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

      {/* Execute action */}
      <Button
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            const nextPlan = await execute();
            setPlan(nextPlan);
          });
        }}
      >
        {isPending ? "Building..." : "Build rental plan"}
      </Button>

      {plan && <RentalPlanDevView plan={plan} />}
    </Box>
  );
}
