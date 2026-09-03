"use client";

import CustomPlanDialog from "@/components/land-manager/harvest/CustomPlanDialog";
import { useProcessResourcesAction } from "@/hooks/useProcessResourcesAction";
import {
  ActionPlan,
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
} from "@mui/material";
import { useEffect, useState } from "react";

interface Props {
  username: string;
  visibleRegions: SplProductionOverviewRegion[];
  postHarvestStrategy: PostHarvestStrategy;
  postHarvestExcludedResources: string[];
  sellPct: number;
  poolPct: number;
  anyBusy: boolean;
  onBusyChange: (busy: boolean) => void;
  onPlan: (plan: ActionPlan, confirm: () => Promise<void>) => void;
  onSuccess: () => void;
}

export default function ProcessResourcesRow({
  username,
  visibleRegions,
  postHarvestStrategy,
  postHarvestExcludedResources,
  sellPct,
  poolPct,
  anyBusy,
  onBusyChange,
  onPlan,
  onSuccess,
}: Props) {
  const [customPlanOpen, setCustomPlanOpen] = useState(false);

  const action = useProcessResourcesAction({
    username,
    visibleRegions,
    postHarvestStrategy:
      postHarvestStrategy === "custom_plan"
        ? "accumulate"
        : postHarvestStrategy,
    excludedResources: postHarvestExcludedResources,
    sellPct,
    poolPct,
    onSuccess,
  });

  useEffect(() => {
    onBusyChange(action.busy);
  }, [action.busy, onBusyChange]);

  // Build the plan first and hand it to the confirm dialog; only the
  // dialog's Confirm actually broadcasts.
  async function run() {
    if (postHarvestStrategy === "custom_plan") {
      setCustomPlanOpen(true);
      return;
    }
    const plan = await action.execute(true);
    if (plan) {
      onPlan(plan, async () => {
        await action.execute(false);
      });
    }
  }

  const strategyLabel =
    postHarvestStrategy === "sell_and_pool"
      ? `Sell ${sellPct}% · Pool ${poolPct}%${sellPct + poolPct < 100 ? ` · Accumulate ${100 - sellPct - poolPct}%` : ""}`
      : POST_HARVEST_STRATEGY_LABELS[postHarvestStrategy];

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
            onClick={run}
          >
            Process Resources…
          </Button>
        </ButtonGroup>

        <Chip
          label={strategyLabel}
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

      {action.warning && (
        <Alert severity="warning" onClose={action.clearWarning} sx={{ mb: 1 }}>
          {action.warning}
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

      {customPlanOpen && (
        <CustomPlanDialog
          username={username}
          visibleRegions={visibleRegions}
          open={customPlanOpen}
          onClose={() => setCustomPlanOpen(false)}
          onSuccess={() => {
            setCustomPlanOpen(false);
            onSuccess();
          }}
        />
      )}
    </>
  );
}
