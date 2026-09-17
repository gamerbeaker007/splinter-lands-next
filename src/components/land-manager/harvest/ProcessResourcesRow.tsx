"use client";

import ActionCard, {
  ActionCardColumn,
} from "@/components/land-manager/harvest/ActionCard";
import CustomPlanDialog from "@/components/land-manager/harvest/CustomPlanDialog";
import { renderResourceIcon } from "@/components/ui/resource/Resource";
import { Resource } from "@/constants/resource/resource";
import { useProcessResourcesAction } from "@/hooks/useProcessResourcesAction";
import { useLandManagerContext } from "@/lib/frontend/context/LandManagerContext";
import { land_worksite_select_iron_icon_url } from "@/lib/shared/statics_icon_urls";
import {
  ActionPlan,
  POST_HARVEST_STRATEGY_LABELS,
  PostHarvestStrategy,
} from "@/types/landManager";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import { Savings as SavingsIcon } from "@mui/icons-material";
import { Alert, Box, Chip, Stack } from "@mui/material";
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
  const { openConfigDialog } = useLandManagerContext();
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
    <ActionCardColumn>
      <ActionCard
        title="5. Process Resources"
        tooltip={
          postHarvestStrategy === "accumulate"
            ? "Accumulate keeps everything in the region — nothing to process"
            : "Apply the post-harvest strategy — shows the plan for confirmation first"
        }
        backgroundImage={land_worksite_select_iron_icon_url}
        icon={<SavingsIcon />}
        accentColor="secondary.main"
        busy={action.busy}
        disabled={anyBusy || postHarvestStrategy === "accumulate"}
        onClick={run}
        onSettings={() => openConfigDialog("post_harvest")}
        settingsLabel="Process Resources settings"
        strategy={
          <Stack direction="column" spacing={0.5} alignItems="flex-start">
            <Chip
              label={strategyLabel}
              size="small"
              variant="outlined"
              sx={{ fontSize: "0.65rem", height: 18 }}
            />

            {postHarvestExcludedResources.length > 0 && (
              <Chip
                label={
                  <Stack direction="row" spacing={0.25} alignItems="center">
                    <span>Excl:</span>
                    {postHarvestExcludedResources.map((r) => (
                      <Box key={r} sx={{ display: "flex" }}>
                        {renderResourceIcon(r as Resource)}
                      </Box>
                    ))}
                  </Stack>
                }
                size="small"
                variant="outlined"
                color="warning"
                sx={{ fontSize: "0.65rem", height: 18 }}
              />
            )}
          </Stack>
        }
      />

      {action.warning && (
        <Alert severity="warning" onClose={action.clearWarning}>
          {action.warning}
        </Alert>
      )}

      {action.result?.success && (
        <Alert severity="success" onClose={action.clearResult}>
          Broadcast successful
          {action.result.txIds.length > 1
            ? ` (${action.result.txIds.length} transactions)`
            : ""}{" "}
          · TX: {action.result.txIds.at(-1) ?? "confirmed"}
        </Alert>
      )}

      {action.error && (
        <Alert severity="error" onClose={action.clearError}>
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
    </ActionCardColumn>
  );
}
