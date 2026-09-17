"use client";

// Type-only: the hook module reaches server actions (and through them Prisma),
// which must never end up in a browser bundle.
import type { WorksiteAlertsData } from "@/hooks/useWorksiteAlerts";
import { formatInt } from "@/lib/formatters";
import {
  AutoFixHigh as AutoFixHighIcon,
  Construction as ConstructionIcon,
  Restaurant as RestaurantIcon,
} from "@mui/icons-material";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useState } from "react";

interface Props {
  data: WorksiteAlertsData;
  /** A worksite broadcast is running — every action button is disabled. */
  busy?: boolean;
  /** Progress text for the running feed ("Signing…", "3/7 confirmed"). */
  busyLabel?: string | null;
  /** Error from the last worksite broadcast. */
  error?: string | null;
  /** Feed the workers on every plot in `data.feedPlan.feedable`. */
  onFeedWorkers: () => void;
  /** Open the Fix grain deficit proposal. */
  onFixGrainDeficit: () => void;
}

/**
 * Worksite states that are blocked until the player acts, surfaced in the
 * Alerts panel so they are discoverable without opening every worksite.
 *
 * Pure presentation: the checks arrive already made by `useWorksiteAlerts`
 * (which delegates to `worksiteEligibility`) and the broadcasts are owned by the
 * container, so the same rules the Worksite page uses stay in one place — and
 * this component renders from props alone.
 */
export default function WorksiteAlerts({
  data,
  busy = false,
  busyLabel = null,
  error = null,
  onFeedWorkers,
  onFixGrainDeficit,
}: Props) {
  const [confirmFeed, setConfirmFeed] = useState(false);

  const { feedPlan, undeveloped } = data;
  const { feedable, shortOnGrain } = feedPlan;
  const feedGrain = feedable.reduce((sum, c) => sum + c.grainCost, 0);

  if (!data.hasPending) return null;

  return (
    <Stack gap={0.5}>
      {feedable.length > 0 && (
        <Alert
          severity="success"
          icon={<RestaurantIcon fontSize="inherit" />}
          action={
            <Button
              size="small"
              color="inherit"
              disabled={busy}
              onClick={() => setConfirmFeed(true)}
              startIcon={
                busy && busyLabel ? (
                  <CircularProgress size={12} color="inherit" />
                ) : undefined
              }
            >
              {busyLabel ?? "Feed workers"}
            </Button>
          }
        >
          <Typography variant="caption" display="block">
            {feedable.length} worksite{feedable.length === 1 ? "" : "s"}{" "}
            finished construction and {feedable.length === 1 ? "is" : "are"}{" "}
            waiting to be fed — costs {formatInt(feedGrain)} GRAIN from the
            regions that hold it. Until they are fed they produce nothing.
          </Typography>
        </Alert>
      )}

      {shortOnGrain.length > 0 && (
        <Alert
          severity="warning"
          icon={<AutoFixHighIcon fontSize="inherit" />}
          action={
            <Tooltip title="Move grain in from your other regions (pool → transfer → swap → buy with DEC)">
              <span>
                <Button
                  size="small"
                  color="inherit"
                  disabled={busy || data.fixTargets.length === 0}
                  onClick={onFixGrainDeficit}
                >
                  Fix grain deficit
                </Button>
              </span>
            </Tooltip>
          }
        >
          <Typography variant="caption" display="block">
            {shortOnGrain.length} finished worksite
            {shortOnGrain.length === 1 ? "" : "s"} cannot be fed — their region
            does not hold enough grain.
          </Typography>
        </Alert>
      )}

      {undeveloped.length > 0 && (
        <Alert
          severity="info"
          icon={<ConstructionIcon fontSize="inherit" />}
          action={
            <Button
              size="small"
              color="inherit"
              component={Link}
              href="/land-manager/worksite"
            >
              Open worksites
            </Button>
          }
        >
          <Typography variant="caption" display="block">
            {undeveloped.length} plot{undeveloped.length === 1 ? "" : "s"} have
            no worksite yet and produce nothing. Pick a building to start
            production.
          </Typography>
        </Alert>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {/* Plan-then-confirm, matching every other broadcast in the Land Manager. */}
      <Dialog
        open={confirmFeed}
        onClose={() => setConfirmFeed(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>Feed workers?</DialogTitle>
        <DialogContent sx={{ pt: "0 !important" }}>
          <Typography variant="body2" color="text.secondary">
            Activate {feedable.length} finished worksite
            {feedable.length === 1 ? "" : "s"} by feeding their workers. This
            pays <strong>{formatInt(feedGrain)} GRAIN</strong> from the regions
            holding it.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button size="small" onClick={() => setConfirmFeed(false)}>
            Back
          </Button>
          <Button
            size="small"
            variant="contained"
            autoFocus
            onClick={() => {
              setConfirmFeed(false);
              onFeedWorkers();
            }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
