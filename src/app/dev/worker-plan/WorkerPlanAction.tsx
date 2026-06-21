"use client";

import {
  BuyConfig,
  BuyPlan,
  RentalConfig,
  RentalPlan,
} from "@/types/landManager";
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { useState, useTransition } from "react";
import WorkerPlanDevView from "./WorkerPlanDevView";

// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  config: RentalConfig | BuyConfig;
  execute: () => Promise<RentalPlan | BuyPlan>;
}

export default function WorkerPlanAction({ config, execute }: Props) {
  const [plan, setPlan] = useState<RentalPlan | BuyPlan | null>(null);
  const [isPending, startTransition] = useTransition();

  const isRental = "max_dec_per_day_per_worker" in config;

  return (
    <Box>
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
                isRental ? "max_dec_per_day_per_worker" : "max_dec_per_worker",
                (isRental
                  ? config.max_dec_per_day_per_worker
                  : config.max_dec_per_worker) || "unlimited",
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
              [
                "batch_size",
                isRental
                  ? config.rental_batch_size
                  : (config.buy_batch_size ?? "all"),
              ],
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
        variant="contained"
        color="primary"
        sx={{ mb: 3 }}
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            const nextPlan = await execute();
            setPlan(nextPlan);
          });
        }}
      >
        {isPending
          ? "Building..."
          : isRental
            ? "Build rental plan"
            : "Build buy plan"}
      </Button>

      {plan && <WorkerPlanDevView plan={plan} />}
    </Box>
  );
}
