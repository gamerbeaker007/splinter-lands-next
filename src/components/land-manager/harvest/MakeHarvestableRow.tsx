"use client";

import { useMakeHarvestableAction } from "@/hooks/useMakeHarvestableAction";
import { DryRunResult, MakeHarvestableStrategy } from "@/types/landManager";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import { PlaylistAddCheck } from "@mui/icons-material";
import {
  Alert,
  Button,
  ButtonGroup,
  Chip,
  CircularProgress,
  Stack,
  Tooltip,
} from "@mui/material";
import { useEffect } from "react";

interface Props {
  username: string;
  visibleRegions: SplProductionOverviewRegion[];
  strategies: MakeHarvestableStrategy[];
  anyBusy: boolean;
  onBusyChange: (busy: boolean) => void;
  onDryRun: (result: DryRunResult) => void;
  onSuccess: () => void;
}

export default function MakeHarvestableRow({
  username,
  visibleRegions,
  strategies,
  anyBusy,
  onBusyChange,
  onDryRun,
  onSuccess,
}: Props) {
  const action = useMakeHarvestableAction({
    username,
    visibleRegions,
    strategies,
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
            color="warning"
            startIcon={
              action.busy ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <PlaylistAddCheck fontSize="small" />
              )
            }
            onClick={() => run(false)}
          >
            Make All Harvestable
          </Button>
          <Tooltip title="Show planned operations without broadcasting">
            <Button
              variant="outlined"
              color="warning"
              onClick={() => run(true)}
            >
              Dry Run
            </Button>
          </Tooltip>
        </ButtonGroup>

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
