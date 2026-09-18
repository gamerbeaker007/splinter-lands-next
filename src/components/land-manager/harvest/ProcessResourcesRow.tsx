"use client";

import ActionCard, {
  ActionCardColumn,
  buildActionStatuses,
} from "@/components/land-manager/harvest/ActionCard";
import CustomPlanDialog from "@/components/land-manager/harvest/CustomPlanDialog";
import { renderResourceIcon } from "@/components/ui/resource/Resource";
import { Resource } from "@/constants/resource/resource";
import { useProcessResourcesAction } from "@/hooks/useProcessResourcesAction";
import { getDefaultCustomPlan } from "@/lib/backend/actions/land-manager/custom-plan-actions";
import { useLandManagerContext } from "@/lib/frontend/context/LandManagerContext";
import { land_worksite_select_iron_icon_url } from "@/lib/shared/statics_icon_urls";
import {
  ActionPlan,
  POST_HARVEST_STRATEGY_LABELS,
  PostHarvestStrategy,
  postHarvestSupportsExclusions,
} from "@/types/landManager";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import { Savings as SavingsIcon } from "@mui/icons-material";
import { Box, Chip, Stack } from "@mui/material";
import { useEffect, useState } from "react";

interface Props {
  username: string;
  visibleRegions: SplProductionOverviewRegion[];
  postHarvestStrategy: PostHarvestStrategy;
  postHarvestExcludedResources: string[];
  sellPct: number;
  poolPct: number;
  /** Destination region for the `transfer_to_region` strategy. */
  transferRegionUid: string | null;
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
  transferRegionUid,
  anyBusy,
  onBusyChange,
  onPlan,
  onSuccess,
}: Props) {
  const { openConfigDialog } = useLandManagerContext();
  const [customPlanOpen, setCustomPlanOpen] = useState(false);
  const [defaultPlanName, setDefaultPlanName] = useState<string | null>(null);

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
    transferRegionUid,
    onSuccess,
  });

  useEffect(() => {
    onBusyChange(action.busy);
  }, [action.busy, onBusyChange]);

  // Which plan the Custom Plan dialog will open on. Re-read after the dialog
  // closes — the player can have changed the default from inside it.
  useEffect(() => {
    if (postHarvestStrategy !== "custom_plan" || customPlanOpen) return;
    let cancelled = false;
    getDefaultCustomPlan().then(({ plan }) => {
      if (!cancelled) setDefaultPlanName(plan?.name ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [postHarvestStrategy, customPlanOpen]);

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

  const destinationRegion = visibleRegions.find(
    (r) => r.region_uid === transferRegionUid
  );

  const strategyLabel =
    postHarvestStrategy === "sell_and_pool"
      ? `Sell ${sellPct}% · Pool ${poolPct}%${sellPct + poolPct < 100 ? ` · Accumulate ${100 - sellPct - poolPct}%` : ""}`
      : postHarvestStrategy === "transfer_to_region"
        ? `Transfer to ${destinationRegion?.name ?? transferRegionUid ?? "— pick a region"}`
        : POST_HARVEST_STRATEGY_LABELS[postHarvestStrategy];

  // Exclusions do not apply to Custom Plan — the plan names its own resources.
  const showExclusions =
    postHarvestSupportsExclusions(postHarvestStrategy) &&
    postHarvestExcludedResources.length > 0;

  // Custom Plan opens on the player's default plan, so name it up front.
  const showDefaultPlan = postHarvestStrategy === "custom_plan";

  return (
    <ActionCardColumn>
      <ActionCard
        title="5. Process Resources"
        tooltip={
          postHarvestStrategy === "accumulate"
            ? "Accumulate keeps everything in the region — nothing to process"
            : postHarvestStrategy === "transfer_to_region" && !transferRegionUid
              ? "Pick a destination region in the Process Resources settings first"
              : "Apply the post-harvest strategy — shows the plan for confirmation first"
        }
        backgroundImage={land_worksite_select_iron_icon_url}
        icon={<SavingsIcon />}
        accentColor="secondary.main"
        busy={action.busy}
        disabled={
          anyBusy ||
          postHarvestStrategy === "accumulate" ||
          // Transfer needs somewhere to transfer TO before it can plan anything.
          (postHarvestStrategy === "transfer_to_region" && !transferRegionUid)
        }
        statuses={buildActionStatuses({
          result: action.result,
          error: action.error,
          warning: action.warning,
        })}
        onClick={run}
        onSettings={() => openConfigDialog("post_harvest")}
        settingsLabel="Process Resources settings"
        strategy={
          <Stack direction="column" spacing={0.5}>
            <Chip
              label={strategyLabel}
              size="small"
              variant="outlined"
              sx={{ fontSize: "0.65rem", height: 18, alignSelf: "center" }}
            />

            {showExclusions && (
              <Chip
                label={
                  <Stack direction="row" spacing={0.25}>
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
                sx={{ fontSize: "0.65rem", height: 18, alignSelf: "center" }}
              />
            )}
            {showDefaultPlan && (
              <Chip
                label={
                  defaultPlanName
                    ? `Default Plan: ${defaultPlanName}`
                    : "No default plan"
                }
                size="small"
                variant="outlined"
                color={defaultPlanName ? "success" : "warning"}
                sx={{ fontSize: "0.65rem", height: 18, alignSelf: "center" }}
              />
            )}
          </Stack>
        }
      />

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
