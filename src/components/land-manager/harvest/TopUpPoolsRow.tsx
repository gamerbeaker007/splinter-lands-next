"use client";

import ActionCard, {
  ActionCardColumn,
  buildActionStatuses,
} from "@/components/land-manager/harvest/ActionCard";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useTopUpPoolsAction } from "@/hooks/useTopUpPoolsAction";
import { getTopUpWindowInfo } from "@/lib/backend/actions/land-manager/log-actions";
import { useLandManagerContext } from "@/lib/frontend/context/LandManagerContext";
import {
  formatTopUpWindow,
  HOURS_PER_WEEK,
} from "@/lib/shared/poolPositionUtils";
import { land_worksite_select_aura_icon_url } from "@/lib/shared/statics_icon_urls";
import {
  ActionPlan,
  TopUpPoolStrategy,
  TopUpWindowInfo,
} from "@/types/landManager";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import { Chip, Stack, Tooltip } from "@mui/material";
import { useCallback, useEffect } from "react";

interface Props {
  username: string;
  visibleRegions: SplProductionOverviewRegion[];
  strategies: TopUpPoolStrategy[];
  anyBusy: boolean;
  onBusyChange: (busy: boolean) => void;
  onPlan: (plan: ActionPlan, confirm: () => Promise<void>) => void;
  onSuccess: () => void;
}

const DEFAULT_WINDOW_INFO: TopUpWindowInfo = {
  hours: HOURS_PER_WEEK,
  disabled: false,
  source: "fallback",
  reason:
    "No successful Top Up Pools run found yet; defaulting to a full 7-day window.",
  lastCompletedAt: null,
};

export default function TopUpPoolsRow({
  username,
  visibleRegions,
  strategies,
  anyBusy,
  onBusyChange,
  onPlan,
  onSuccess,
}: Props) {
  const {
    data,
    loading: windowLoading,
    mutate: setWindowInfo,
    refetch: reloadWindowInfo,
  } = useAsyncData(`top-up-window:${username}`, () =>
    getTopUpWindowInfo(username).catch((): TopUpWindowInfo => ({
      hours: HOURS_PER_WEEK,
      disabled: false,
      source: "fallback",
      reason:
        "Could not read Top Up history; defaulting to a full 7-day window.",
      lastCompletedAt: null,
    }))
  );
  const windowInfo = data ?? DEFAULT_WINDOW_INFO;

  const { openConfigDialog } = useLandManagerContext();

  // Applying the cooldown is a reaction to the broadcast succeeding, not to a
  // rendered value, so it hangs off the action's success callback rather than
  // an effect watching `action.result`.
  const handleSuccess = useCallback(() => {
    // Show the cooldown immediately, then refresh from DB so the persisted
    // source of truth takes over.
    setWindowInfo({
      hours: 1,
      disabled: true,
      source: "fallback",
      reason:
        "Top Up Pools just completed successfully. A 1-hour cooldown is now active.",
      lastCompletedAt: new Date().toISOString(),
    });
    void reloadWindowInfo();
    onSuccess();
  }, [onSuccess, reloadWindowInfo, setWindowInfo]);

  const action = useTopUpPoolsAction({
    username,
    visibleRegions,
    strategies,
    topUpWindow: windowInfo,
    onSuccess: handleSuccess,
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

  const disabled =
    anyBusy || strategies.length === 0 || windowLoading || windowInfo.disabled;

  const displayStrategy = (s: TopUpPoolStrategy) => {
    const labels = {
      use_owned_dec: "Use DEC",
      swap_resource: "Swap",
      sell_resource: "Sell",
      buy_resources: "Buy",
    };
    return labels[s] ?? s;
  };

  const productionHours = windowInfo.hours;
  const isFullWeek = productionHours >= HOURS_PER_WEEK;
  const windowLabel = formatTopUpWindow(productionHours);
  const tooltip =
    strategies.length === 0
      ? "Enable at least one Top Up Pool strategy in the config"
      : windowLoading
        ? "Loading Top Up timing window from successful run history..."
        : windowInfo.disabled
          ? `Top Up Pools is temporarily disabled: ${windowInfo.reason}`
          : `Add the net external need over ${windowLabel} (+10% margin) back into the liquidity pools — review the plan before confirming`;

  return (
    <ActionCardColumn>
      <ActionCard
        title="4. Top Up Pools"
        tooltip={tooltip}
        backgroundImage={land_worksite_select_aura_icon_url}
        icon={<WaterDropIcon />}
        accentColor="info.main"
        busy={action.busy}
        disabled={disabled}
        statuses={buildActionStatuses({
          result: action.result,
          error: action.error,
          warning: action.warning,
          successTitle: "Pools topped up",
        })}
        onClick={run}
        onSettings={() => openConfigDialog("top_up_pools")}
        settingsLabel="Top Up Pools settings"
        strategy={
          <Stack direction="column" spacing={0.5}>
            {strategies.length === 0 ? (
              <Chip
                label="No strategies enabled"
                size="small"
                variant="outlined"
                color="warning"
                sx={{ fontSize: "0.65rem", height: 18 }}
              />
            ) : (
              <Stack direction="row" spacing={0.25}>
                {strategies.map((s, i) => (
                  <Chip
                    key={s}
                    label={`${i + 1}. ${displayStrategy(s)}`}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: "0.65rem", height: 18 }}
                  />
                ))}
              </Stack>
            )}

            <Tooltip
              title={
                windowLoading
                  ? "Loading planning window..."
                  : `${windowInfo.reason}${windowInfo.lastCompletedAt ? ` Last successful run: ${new Date(windowInfo.lastCompletedAt).toLocaleString("en-US")}.` : ""}${isFullWeek ? " Top-up is currently sized to 7 days." : ` Top-up is currently sized to ${windowLabel}.`}`
              }
            >
              <Chip
                label={windowInfo.disabled ? "<1h" : windowLabel}
                size="small"
                color={
                  windowInfo.disabled
                    ? "warning"
                    : isFullWeek
                      ? "success"
                      : "secondary"
                }
                sx={{
                  fontSize: "0.65rem",
                  height: 18,
                  fontWeight: 700,
                  alignSelf: "center",
                }}
              />
            </Tooltip>
          </Stack>
        }
      />
    </ActionCardColumn>
  );
}
