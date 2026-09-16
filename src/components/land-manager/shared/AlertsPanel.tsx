"use client";

import AlertsPanelView from "@/components/land-manager/shared/AlertsPanelView";
import FixGrainDeficitDialog from "@/components/land-manager/worksites/FixGrainDeficitDialog";
import {
  bulkBusyKey,
  useBulkWorksiteAction,
} from "@/hooks/useBulkWorksiteAction";
import { useLandManagerRegionData } from "@/hooks/useLandManagerRegionData";
import { usePoolBufferAlerts } from "@/hooks/usePoolBufferAlerts";
import { useWorksiteAlerts } from "@/hooks/useWorksiteAlerts";
import { useLandManagerContext } from "@/lib/frontend/context/LandManagerContext";
import { actionButtonLabel } from "@/lib/shared/actionPhase";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import { useState } from "react";

interface Props {
  enabledRegions: number[];
  /** All of the player's regions — needed to measure consumption per region. */
  allRegions: SplProductionOverviewRegion[];
  /** True when either pool strategy is configured (pool withdraw or top-up). */
  poolStrategyEnabled: boolean;
  refreshKey?: number;
  /** Re-read the Land Manager panels after an alert action broadcasts. */
  onSuccess?: () => void;
}

/**
 * Data container for the Alerts panel.
 *
 * Owns everything impure — the three data hooks, the worksite broadcast and the
 * Fix grain deficit dialog — and hands plain values to AlertsPanelView, which
 * does the rendering. Keeping the broadcast here is what lets the view render
 * from props alone: `splBroadcast` imports a server action, and through it
 * Prisma, which cannot be bundled for the browser.
 */
export default function AlertsPanel({
  enabledRegions,
  allRegions,
  poolStrategyEnabled,
  refreshKey = 0,
  onSuccess,
}: Props) {
  const { auth, config } = useLandManagerContext();
  const { rows: poolBufferRows } = usePoolBufferAlerts(
    allRegions,
    enabledRegions,
    poolStrategyEnabled,
    refreshKey
  );
  const {
    eligibility,
    stakedDEC,
    totalStaked,
    totalRequired,
    globalShortfall,
    globalExcess,
    loading,
  } = useLandManagerRegionData(refreshKey);
  const worksiteAlerts = useWorksiteAlerts(refreshKey);

  const action = useBulkWorksiteAction();
  const [fixOpen, setFixOpen] = useState(false);

  const username = auth.username ?? "";
  const shortOnGrain = worksiteAlerts.feedPlan.shortOnGrain;
  const feeding = action.busyKey === bulkBusyKey.feed;

  async function handleFeedWorkers() {
    const res = await action.feedWorkers(
      username,
      worksiteAlerts.feedPlan.feedable.map((c) => ({
        regionUid: c.regionUid,
        deedUid: c.deed.deed_uid,
        projectId: c.projectId,
      }))
    );
    if (res.success) onSuccess?.();
  }

  return (
    <>
      <AlertsPanelView
        loading={loading}
        poolBufferRows={poolBufferRows}
        eligibility={eligibility}
        stakedDEC={stakedDEC}
        totalStaked={totalStaked}
        totalRequired={totalRequired}
        globalShortfall={globalShortfall}
        globalExcess={globalExcess}
        worksiteAlerts={worksiteAlerts}
        worksiteBusy={action.busy}
        worksiteBusyLabel={
          feeding
            ? (actionButtonLabel(action.phase, action.progress) ?? "Feeding…")
            : null
        }
        worksiteError={action.error}
        onFeedWorkers={handleFeedWorkers}
        onFixGrainDeficit={() => setFixOpen(true)}
      />

      {fixOpen && (
        <FixGrainDeficitDialog
          open={fixOpen}
          username={username}
          strategies={config.make_harvestable_strategies}
          targets={worksiteAlerts.fixTargets}
          subject={`${shortOnGrain.length} worksite${shortOnGrain.length === 1 ? "" : "s"}`}
          plotLabels={shortOnGrain.map((c) => c.plotLabel)}
          onClose={() => setFixOpen(false)}
          onSuccess={() => {
            setFixOpen(false);
            onSuccess?.();
          }}
        />
      )}
    </>
  );
}
