"use client";

import ActionCard, {
  ActionCardColumn,
} from "@/components/land-manager/harvest/ActionCard";
import { useMakeHarvestableAction } from "@/hooks/useMakeHarvestableAction";
import { useLandManagerContext } from "@/lib/frontend/context/LandManagerContext";
import { land_worksite_select_stone_icon_url } from "@/lib/shared/statics_icon_urls";
import { ActionPlan, MakeHarvestableStrategy } from "@/types/landManager";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import { PlaylistAddCheck } from "@mui/icons-material";
import { Alert, Chip } from "@mui/material";
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

  const displayStrategy = (s: MakeHarvestableStrategy) => {
    const labels = {
      pool: "Pool",
      buy_dec: "Buy",
      transfer: "Transfer",
      swap: "Swap",
    };
    return labels[s] ?? s;
  };

  return (
    <ActionCardColumn>
      <ActionCard
        title="1. Make Harvestable"
        tooltip="Cover every region's harvest shortfall — shows the plan for confirmation first"
        backgroundImage={land_worksite_select_stone_icon_url}
        icon={<PlaylistAddCheck />}
        accentColor="warning.main"
        busy={action.busy}
        disabled={anyBusy}
        onClick={run}
        onSettings={() => openConfigDialog("make_harvestable")}
        settingsLabel="Make Harvestable settings"
        strategy={strategies.map((s, i) => (
          <Chip
            key={s}
            label={`${i + 1}. ${displayStrategy(s)}`}
            size="small"
            variant="outlined"
            sx={{ fontSize: "0.65rem", height: 18 }}
          />
        ))}
      />

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
    </ActionCardColumn>
  );
}
