"use client";

import { useMakeHarvestableAction } from "@/hooks/useMakeHarvestableAction";
import { useLandManagerContext } from "@/lib/frontend/context/LandManagerContext";
import { ActionPlan, MakeHarvestableStrategy } from "@/types/landManager";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import { PlaylistAddCheck } from "@mui/icons-material";
import SettingsIcon from "@mui/icons-material/Settings";
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Stack,
  Tooltip,
} from "@mui/material";
import IconButton from "@mui/material/IconButton";
import { useEffect } from "react";

interface Props {
  username: string;
  visibleRegions: SplProductionOverviewRegion[];
  strategies: MakeHarvestableStrategy[];
  anyBusy: boolean;
  onBusyChange: (busy: boolean) => void;
  onPlan: (plan: ActionPlan, confirm: () => Promise<void>) => void;
  onSuccess: () => void;
}

export default function MakeHarvestableRow({
  username,
  visibleRegions,
  strategies,
  anyBusy,
  onBusyChange,
  onPlan,
  onSuccess,
}: Props) {
  const { openConfigDialog } = useLandManagerContext();
  const action = useMakeHarvestableAction({
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

  return (
    <>
      <Stack
        direction="row"
        gap={1}
        flexWrap="wrap"
        alignItems="center"
        mb={1.5}
      >
        <Tooltip title="Cover every region's harvest shortfall — shows the plan for confirmation first">
          <span>
            <Button
              size="small"
              disabled={anyBusy}
              variant="contained"
              color="warning"
              startIcon={
                action.busy ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <PlaylistAddCheck fontSize="small" />
                )
              }
              onClick={run}
            >
              Make All Harvestable…
            </Button>
          </span>
        </Tooltip>

        <IconButton
          size="small"
          onClick={() => openConfigDialog("make_harvestable")}
          sx={{ textTransform: "none" }}
        >
          <SettingsIcon fontSize="small" />
        </IconButton>
        <Stack direction="row" gap={0.5} flexWrap="wrap">
          {strategies.map((s, i) => (
            <Chip
              key={s}
              label={`${i + 1}. ${s}`}
              size="small"
              variant="outlined"
              sx={{ fontSize: "0.7rem" }}
            />
          ))}
        </Stack>
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
