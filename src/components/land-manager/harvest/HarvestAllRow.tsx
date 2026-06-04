"use client";

import { useHarvestAllAction } from "@/hooks/useHarvestAllAction";
import { DonationConfig, DryRunResult } from "@/types/landManager";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import { Agriculture as HarvestIcon } from "@mui/icons-material";
import {
  Alert,
  Button,
  ButtonGroup,
  CircularProgress,
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
  onDryRun: (result: DryRunResult) => void;
  onSuccess: () => void;
}

export default function HarvestAllRow({
  username,
  visibleRegions,
  donation,
  anyBusy,
  onBusyChange,
  onDryRun,
  onSuccess,
}: Props) {
  const action = useHarvestAllAction({
    username,
    visibleRegions,
    donation,
    onSuccess,
  });

  useEffect(() => {
    onBusyChange(action.busy);
  }, [action.busy, onBusyChange]);

  async function run(isDryRun: boolean) {
    const dr = await action.execute(isDryRun);
    if (dr) onDryRun(dr);
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
        <ButtonGroup size="small" disabled={anyBusy}>
          <Button
            variant="contained"
            color="success"
            startIcon={
              action.busy ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <HarvestIcon fontSize="small" />
              )
            }
            onClick={() => run(false)}
          >
            Harvest All
          </Button>
          <Tooltip title="Show planned operations without broadcasting">
            <Button
              variant="outlined"
              color="success"
              onClick={() => run(true)}
            >
              Dry Run
            </Button>
          </Tooltip>
        </ButtonGroup>
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
