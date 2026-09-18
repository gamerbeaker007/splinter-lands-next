"use client";

import ActionCard, {
  ActionCardColumn,
  buildActionStatuses,
} from "@/components/land-manager/harvest/ActionCard";
import { useHarvestAllAction } from "@/hooks/useHarvestAllAction";
import { useLandManagerContext } from "@/lib/frontend/context/LandManagerContext";
import { land_worksite_select_grain_icon_url } from "@/lib/shared/statics_icon_urls";
import { ActionPlan, DonationConfig } from "@/types/landManager";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import { Agriculture as HarvestIcon } from "@mui/icons-material";
import { Chip } from "@mui/material";
import { useEffect } from "react";

interface Props {
  username: string;
  visibleRegions: SplProductionOverviewRegion[];
  donation: DonationConfig;
  anyBusy: boolean;
  onBusyChange: (busy: boolean) => void;
  onPlan: (plan: ActionPlan, confirm: () => Promise<void>) => void;
  onSuccess: () => void;
}

export default function HarvestAllRow({
  username,
  visibleRegions,
  donation,
  anyBusy,
  onBusyChange,
  onPlan,
  onSuccess,
}: Props) {
  const { openConfigDialog } = useLandManagerContext();

  const action = useHarvestAllAction({
    username,
    visibleRegions,
    donation,
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

  const donationEnabled = donation.enabled && donation.pct > 0;

  return (
    <ActionCardColumn>
      <ActionCard
        title="2. Harvest All"
        tooltip="Harvest every enabled region — shows the plan for confirmation first"
        backgroundImage={land_worksite_select_grain_icon_url}
        icon={<HarvestIcon />}
        accentColor="success.main"
        busy={action.busy}
        disabled={anyBusy}
        statuses={buildActionStatuses({
          result: action.result,
          error: action.error,
        })}
        onClick={run}
        onSettings={() => openConfigDialog("enabled_regions")}
        settingsLabel="Harvest All settings"
        strategy={
          <>
            <Chip
              label={"All enabled regions"}
              size="small"
              variant="outlined"
              sx={{ fontSize: "0.65rem", height: 18 }}
            />
            {donationEnabled && (
              <Chip
                label={`Donation ${donation.pct}%`}
                size="small"
                variant="outlined"
                sx={{ fontSize: "0.65rem", height: 18 }}
              />
            )}
          </>
        }
      />
    </ActionCardColumn>
  );
}
