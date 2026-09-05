"use client";

import { useHarvestAllAction } from "@/hooks/useHarvestAllAction";
import { useLandManagerContext } from "@/lib/frontend/context/LandManagerContext";
import { ActionPlan, DonationConfig } from "@/types/landManager";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import { Agriculture as HarvestIcon } from "@mui/icons-material";
import SettingsIcon from "@mui/icons-material/Settings";

import {
  Alert,
  Button,
  CircularProgress,
  IconButton,
  Stack,
  Tooltip,
} from "@mui/material";
import { useEffect } from "react";

interface Props {
  username: string;
  visibleRegions: SplProductionOverviewRegion[];
  donation: DonationConfig;
  anyBusy: boolean;
  onBusyChange: (busy: boolean) => void;
  onPlan: (plan: ActionPlan, confirm: () => Promise<void>) => void;
  onSuccess: () => void;
}

export default function HarvestAllRow({
  username,
  visibleRegions,
  donation,
  anyBusy,
  onBusyChange,
  onPlan,
  onSuccess,
}: Props) {
  const { openConfigDialog } = useLandManagerContext();

  const action = useHarvestAllAction({
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
        <Tooltip title="Harvest every enabled region — shows the plan for confirmation first">
          <span>
            <Button
              size="small"
              disabled={anyBusy}
              variant="contained"
              color="success"
              startIcon={
                action.busy ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <HarvestIcon fontSize="small" />
                )
              }
              onClick={run}
            >
              Harvest All…
            </Button>
          </span>
        </Tooltip>
        <IconButton
          size="small"
          color="inherit"
          onClick={() => openConfigDialog("enabled_regions")}
        >
          <SettingsIcon fontSize="small" />
        </IconButton>
      </Stack>

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
