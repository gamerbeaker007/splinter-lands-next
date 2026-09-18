"use client";

import ActionCard, {
  ActionCardColumn,
  buildActionStatuses,
} from "@/components/land-manager/harvest/ActionCard";
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
import { useCallback, useEffect, useState } from "react";

interface Props {
  username: string;
  visibleRegions: SplProductionOverviewRegion[];
  strategies: TopUpPoolStrategy[];
  anyBusy: boolean;
  onBusyChange: (busy: boolean) => void;
  onPlan: (plan: ActionPlan, confirm: () => Promise<void>) => void;
  onSuccess: () => void;
}

export default function TopUpPoolsRow({
  username,
  visibleRegions,
  strategies,
  anyBusy,
  onBusyChange,
  onPlan,
  onSuccess,
}: Props) {
  const [windowInfo, setWindowInfo] = useState<TopUpWindowInfo>({
    hours: HOURS_PER_WEEK,
    disabled: false,
    source: "fallback",
    reason:
      "No successful Top Up Pools run found yet; defaulting to a full 7-day window.",
    lastCompletedAt: null,
  });
  const [windowLoading, setWindowLoading] = useState(true);

  const reloadWindowInfo = useCallback(async () => {
    setWindowLoading(true);
    try {
      const info = await getTopUpWindowInfo(username);
      setWindowInfo(info);
    } catch {
      setWindowInfo({
        hours: HOURS_PER_WEEK,
        disabled: false,
        source: "fallback",
        reason:
          "Could not read Top Up history; defaulting to a full 7-day window.",
        lastCompletedAt: null,
      });
    } finally {
      setWindowLoading(false);
    }
  }, [username]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const info = await getTopUpWindowInfo(username);
        if (mounted) setWindowInfo(info);
      } catch {
        if (!mounted) return;
        setWindowInfo({
          hours: HOURS_PER_WEEK,
          disabled: false,
          source: "fallback",
          reason:
            "Could not read Top Up history; defaulting to a full 7-day window.",
          lastCompletedAt: null,
        });
      } finally {
        if (mounted) setWindowLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [username]);

  const { openConfigDialog } = useLandManagerContext();
  const action = useTopUpPoolsAction({
    username,
    visibleRegions,
    strategies,
    topUpWindow: windowInfo,
    onSuccess,
  });

  useEffect(() => {
    onBusyChange(action.busy);
  }, [action.busy, onBusyChange]);

  useEffect(() => {
    if (!action.result?.success) return;

    // Apply cooldown immediately in the UI after a successful broadcast, then
    // refresh from DB so the persisted source of truth takes over.
    const justCompletedAt = new Date().toISOString();
    setWindowInfo({
      hours: 1,
      disabled: true,
      source: "fallback",
      reason:
        "Top Up Pools just completed successfully. A 1-hour cooldown is now active.",
      lastCompletedAt: justCompletedAt,
    });
    setWindowLoading(false);
    void reloadWindowInfo();
  }, [action.result?.success, reloadWindowInfo]);

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
          : `Add ${windowLabel} of consumption (+10%) back into the liquidity pools — shows the plan for confirmation first`;

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
