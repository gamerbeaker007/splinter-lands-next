"use client";

import { useProcessResourcesAction } from "@/hooks/useProcessResourcesAction";
import {
  DryRunResult,
  POST_HARVEST_STRATEGY_LABELS,
  PostHarvestStrategy,
} from "@/types/landManager";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import { Savings as SavingsIcon } from "@mui/icons-material";
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
  postHarvestStrategy: PostHarvestStrategy;
  postHarvestExcludedResources: string[];
  anyBusy: boolean;
  onBusyChange: (busy: boolean) => void;
  onDryRun: (result: DryRunResult) => void;
  onSuccess: () => void;
}

export default function ProcessResourcesRow({
  username,
  visibleRegions,
  postHarvestStrategy,
  postHarvestExcludedResources,
  anyBusy,
  onBusyChange,
  onDryRun,
  onSuccess,
}: Props) {
  const action = useProcessResourcesAction({
    username,
    visibleRegions,
    postHarvestStrategy,
    excludedResources: postHarvestExcludedResources,
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
        <ButtonGroup
          size="small"
          disabled={anyBusy || postHarvestStrategy === "accumulate"}
        >
          <Button
            variant="contained"
            color="secondary"
            startIcon={
              action.busy ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <SavingsIcon fontSize="small" />
              )
            }
            onClick={() => run(false)}
          >
            Process Resources
          </Button>
          <Tooltip title="Show planned operations without broadcasting">
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => run(true)}
            >
              Dry Run
            </Button>
          </Tooltip>
        </ButtonGroup>

        <Chip
          label={POST_HARVEST_STRATEGY_LABELS[postHarvestStrategy]}
          size="small"
          variant="outlined"
          sx={{ fontSize: "0.7rem" }}
        />
        {postHarvestExcludedResources.map((r) => (
          <Chip
            key={r}
            label={`Excl: ${r}`}
            size="small"
            variant="outlined"
            color="warning"
            sx={{ fontSize: "0.7rem" }}
          />
        ))}
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
