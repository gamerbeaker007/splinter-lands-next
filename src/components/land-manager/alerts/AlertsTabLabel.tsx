"use client";

import { CircularProgress, Stack } from "@mui/material";
import AlertCountBadges from "./AlertCountBadges";
import { useLandManagerAlerts } from "./LandManagerAlertsProvider";

/** Tab title: "Alerts (x ⛔ / y ⚠ / z ℹ)", with a spinner while loading. */
export default function AlertsTabLabel() {
  const { loading, counts } = useLandManagerAlerts();
  return (
    <Stack direction="row" alignItems="center" gap={1} component="span">
      <span>Alerts</span>
      {loading ? (
        <CircularProgress size={14} color="inherit" />
      ) : (
        <Stack direction="row" alignItems="center" component="span">
          (<AlertCountBadges counts={counts} size={14} />)
        </Stack>
      )}
    </Stack>
  );
}
