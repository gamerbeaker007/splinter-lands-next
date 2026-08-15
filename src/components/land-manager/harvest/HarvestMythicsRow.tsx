"use client";

import { useHarvestMythicsAction } from "@/hooks/useHarvestMythicsAction";
import { DonationConfig, ActionPlan } from "@/types/landManager";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import { AutoAwesome as MythicIcon } from "@mui/icons-material";
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Stack,
  Tooltip,
} from "@mui/material";
import { useEffect } from "react";

interface Props {
  username: string;
  visibleRegions: SplProductionOverviewRegion[];
  donation: DonationConfig;
  hasMythics: boolean;
  anyBusy: boolean;
  onBusyChange: (busy: boolean) => void;
  onPlan: (plan: ActionPlan, confirm: () => Promise<void>) => void;
  onSuccess: () => void;
}

export default function HarvestMythicsRow({
  username,
  visibleRegions,
  donation,
  hasMythics,
  anyBusy,
  onBusyChange,
  onPlan,
  onSuccess,
}: Props) {
  const action = useHarvestMythicsAction({
    username,
    visibleRegions,
    donation,
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

  return (
    <>
      <Stack
        direction="row"
        gap={2}
        flexWrap="wrap"
        alignItems="center"
        mb={1.5}
      >
        <Tooltip title="Collect Keep & Castle taxes — shows the plan for confirmation first">
          <span>
            <Button
              size="small"
              disabled={anyBusy || !hasMythics}
              variant="contained"
              color="secondary"
              startIcon={
                action.busy ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <MythicIcon fontSize="small" />
                )
              }
              onClick={run}
            >
              Harvest Mythics…
            </Button>
          </span>
        </Tooltip>

        <Chip
          label="Keeps &amp; Castles"
          size="small"
          variant="outlined"
          sx={{ fontSize: "0.7rem" }}
        />
      </Stack>

      {action.isVerifying && (
        <Alert
          severity="info"
          sx={{ mb: 1 }}
          icon={<CircularProgress size={16} />}
        >
          Verifying transactions on-chain… (up to 30s)
        </Alert>
      )}

      {action.result?.success && (
        <Alert severity="success" onClose={action.clearResult} sx={{ mb: 1 }}>
          Broadcast successful
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
