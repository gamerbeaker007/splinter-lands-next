"use client";

import FixGrainDeficitDialog from "@/components/land-manager/worksites/FixGrainDeficitDialog";
import {
  bulkBusyKey,
  useBulkWorksiteAction,
} from "@/hooks/useBulkWorksiteAction";
import { useLandManagerContext } from "@/lib/frontend/context/LandManagerContext";
import { actionButtonLabel } from "@/lib/shared/actionPhase";
import { useState } from "react";
import { useLandManagerAlerts } from "./LandManagerAlertsProvider";
import LandManagerAlertsView from "./LandManagerAlertsView";

/**
 * Data container for the Alerts page.
 *
 * The alert data comes from LandManagerAlertsProvider (shared with the tab
 * title); this container owns the worksite broadcast and the Fix grain deficit
 * dialog. Keeping the broadcast here is what lets the view render from props
 * alone: `splBroadcast` imports a server action, and through it Prisma, which
 * cannot be bundled for the browser.
 */
export default function AlertsPage() {
  const { auth, config, triggerRefresh } = useLandManagerContext();
  const { loading, input, alerts, counts, playerAlertsError } =
    useLandManagerAlerts();

  const action = useBulkWorksiteAction();
  const [fixOpen, setFixOpen] = useState(false);

  const username = auth.username ?? "";
  const { feedPlan, fixTargets } = input.worksiteAlerts;
  const shortOnGrain = feedPlan.shortOnGrain;
  const feeding = action.busyKey === bulkBusyKey.feed;

  async function handleFeedWorkers() {
    const res = await action.feedWorkers(
      username,
      feedPlan.feedable.map((c) => ({
        regionUid: c.regionUid,
        deedUid: c.deed.deed_uid,
        projectId: c.projectId,
      }))
    );
    if (res.success) triggerRefresh();
  }

  return (
    <>
      <LandManagerAlertsView
        loading={loading}
        input={input}
        alerts={alerts}
        counts={counts}
        playerAlertsError={playerAlertsError}
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
          targets={fixTargets}
          subject={`${shortOnGrain.length} worksite${shortOnGrain.length === 1 ? "" : "s"}`}
          plotLabels={shortOnGrain.map((c) => c.plotLabel)}
          onClose={() => setFixOpen(false)}
          onSuccess={() => {
            setFixOpen(false);
            triggerRefresh();
          }}
        />
      )}
    </>
  );
}
