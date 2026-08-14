"use client";

import { useTopUpPoolsAction } from "@/hooks/useTopUpPoolsAction";
import { ActionPlan, TopUpPoolStrategy } from "@/types/landManager";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import { WaterDrop as WaterDropIcon } from "@mui/icons-material";
import {
  Alert,
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
  visibleRegions: SplProductionOverviewRegion[];
  strategies: TopUpPoolStrategy[];
  anyBusy: boolean;
  onBusyChange: (busy: boolean) => void;
  onPlan: (plan: ActionPlan, confirm: () => Promise<void>) => void;
  onSuccess: () => void;
}

export default function TopUpPoolsRow({
  username,
  visibleRegions,
  strategies,
  anyBusy,
  onBusyChange,
  onPlan,
  onSuccess,
}: Props) {
  const action = useTopUpPoolsAction({
    username,
    visibleRegions,
    strategies,
    onSuccess,
  });

  useEffect(() => {
    onBusyChange(action.busy);
  }, [action.busy, onBusyChange]);

  // Build the plan first and hand it to the confirm dialog; only the
  // dialog's Confirm actually broadcasts.
  async function run() {
    const plan = await action.execute(true);
    if (plan) {
      onPlan(plan, async () => {
        await action.execute(false);
      });
    }
  }

  const disabled = anyBusy || strategies.length === 0;

  return (
    <>
      <Stack
        direction="row"
        gap={2}
        flexWrap="wrap"
        alignItems="center"
        mb={1.5}
      >
        <Tooltip
          title={
            strategies.length === 0
              ? "Enable at least one Top Up Pool strategy in the config"
              : "Add ~1 week of consumption (+10%) back into the liquidity pools — shows the plan for confirmation first"
          }
        >
          <span>
            <Button
              size="small"
              variant="contained"
              color="info"
              disabled={disabled}
              startIcon={
                action.busy ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <WaterDropIcon fontSize="small" />
                )
              }
              onClick={run}
            >
              Top Up Pools…
            </Button>
          </span>
        </Tooltip>

        <Stack direction="row" gap={0.5} flexWrap="wrap">
          {strategies.length === 0 ? (
            <Chip
              label="No strategies enabled"
              size="small"
              variant="outlined"
              color="warning"
              sx={{ fontSize: "0.7rem" }}
            />
          ) : (
            strategies.map((s, i) => (
              <Chip
                key={s}
                label={`${i + 1}. ${s}`}
                size="small"
                variant="outlined"
                sx={{ fontSize: "0.7rem" }}
              />
            ))
          )}
        </Stack>

        <Alert
          severity="info"
          sx={{
            height: 24,
            py: 0,
            px: 1,
            alignItems: "center",
            borderRadius: "12px",
            "& .MuiAlert-message": { p: 0.5 },
            "& .MuiAlert-icon": {
              p: 0,
              mr: 0.5,
              fontSize: 20,
            },
          }}
        >
          <Typography variant="caption">Run once per week</Typography>
        </Alert>
      </Stack>

      {action.warning && (
        <Alert severity="warning" onClose={action.clearWarning} sx={{ mb: 1 }}>
          {action.warning}
        </Alert>
      )}

      {action.result?.success && (
        <Alert severity="success" onClose={action.clearResult} sx={{ mb: 1 }}>
          Pools topped up
          {action.result.txIds.length > 1
            ? ` (${action.result.txIds.length} transactions)`
            : ""}{" "}
          · TX: {action.result.txIds.at(-1) ?? "confirmed"}
        </Alert>
      )}

      {action.error && (
        <Alert severity="error" onClose={action.clearError} sx={{ mb: 1 }}>
          {action.error}
        </Alert>
      )}
    </>
  );
}
