"use client";

import ActionCard, {
  ActionCardColumn,
  buildActionStatuses,
} from "@/components/land-manager/harvest/ActionCard";
import { useHarvestMythicsAction } from "@/hooks/useHarvestMythicsAction";
import { land_castle_icon_url } from "@/lib/shared/statics_icon_urls";
import { ActionPlan, DonationConfig } from "@/types/landManager";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import { AutoAwesome as MythicIcon } from "@mui/icons-material";
import { Alert, Chip, CircularProgress } from "@mui/material";
import { useEffect } from "react";

interface Props {
  username: string;
  visibleRegions: SplProductionOverviewRegion[];
  donation: DonationConfig;
  hasMythics: boolean;
  anyBusy: boolean;
  onBusyChange: (busy: boolean) => void;
  onPlan: (plan: ActionPlan, confirm: () => Promise<void>) => void;
  onSuccess: () => void;
}

export default function HarvestMythicsRow({
  username,
  visibleRegions,
  donation,
  hasMythics,
  anyBusy,
  onBusyChange,
  onPlan,
  onSuccess,
}: Props) {
  const action = useHarvestMythicsAction({
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
        title="3. Harvest Mythics"
        tooltip={
          hasMythics
            ? "Collect Keep & Castle taxes — shows the plan for confirmation first"
            : "No Keeps or Castles in the enabled regions"
        }
        backgroundImage={land_castle_icon_url}
        icon={<MythicIcon />}
        accentColor="secondary.main"
        busy={action.busy}
        disabled={anyBusy || !hasMythics}
        statuses={buildActionStatuses({
          result: action.result,
          error: action.error,
        })}
        onClick={run}
        strategy={
          <>
            <Chip
              label="Keeps & Castles"
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

      {action.isVerifying && (
        <Alert severity="info" icon={<CircularProgress size={16} />}>
          Verifying transactions on-chain… (up to 30s)
        </Alert>
      )}
    </ActionCardColumn>
  );
}
