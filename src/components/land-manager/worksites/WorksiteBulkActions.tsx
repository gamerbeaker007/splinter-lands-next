"use client";

import FixGrainDeficitDialog from "@/components/land-manager/worksites/FixGrainDeficitDialog";
import {
  bulkBusyKey,
  useBulkWorksiteAction,
} from "@/hooks/useBulkWorksiteAction";
import { CoverGrainTarget } from "@/lib/frontend/coverWorksiteGrainOps";
import { actionButtonLabel, actionPhaseLabel } from "@/lib/shared/actionPhase";
import {
  BulkChangeWorksiteOption,
  planBulkCancelConstruction,
  planBulkChangeWorksite,
  planBulkFeed,
} from "@/lib/shared/worksiteEligibility";
import { DeedComplete } from "@/types/deed";
import { MakeHarvestableStrategy } from "@/types/landManager";
import {
  worksiteConstructionOpName,
  worksiteSelectIconMap,
} from "@/types/planner";
import {
  AutoFixHigh as AutoFixHighIcon,
  Cancel as CancelIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Restaurant as RestaurantIcon,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";

interface Props {
  /** The current selection — the plots left after the active filters. */
  deeds: DeedComplete[];
  username: string;
  /** Grain held per region_uid — gates how many plots can actually be fed. */
  regionGrain: Record<string, number>;
  strategies: MakeHarvestableStrategy[];
  /** Shared "now" so counts, plan and execution judge against the same instant. */
  nowMs: number;
  onSuccess: () => void;
}

const fmt = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: 0 });

type PendingDialog =
  | { type: "feed" }
  | { type: "cancel" }
  | { type: "change"; option: BulkChangeWorksiteOption }
  | null;

export default function WorksiteBulkActions({
  deeds,
  username,
  regionGrain,
  strategies,
  nowMs,
  onSuccess,
}: Props) {
  const action = useBulkWorksiteAction();
  // Only the button that started the run spins; the rest are merely disabled.
  const isRunning = (key: string) => key !== "" && action.busyKey === key;
  const buttonStatus = (key: string) =>
    isRunning(key) ? actionButtonLabel(action.phase, action.progress) : null;
  const runningLabel = (key: string) =>
    isRunning(key) ? actionPhaseLabel(action.phase) : null;

  const [collapsed, setCollapsed] = useState(false);
  const [pending, setPending] = useState<PendingDialog>(null);
  const [fixOpen, setFixOpen] = useState(false);

  // Everything below derives from the same eligibility helpers the per-plot card
  // uses, so counts, enabled states and the ops that get broadcast agree.
  const feedPlan = useMemo(
    () => planBulkFeed(deeds, regionGrain, nowMs),
    [deeds, regionGrain, nowMs]
  );

  const changeOptions = useMemo(
    () => planBulkChangeWorksite(deeds, nowMs),
    [deeds, nowMs]
  );

  const cancelCandidates = useMemo(
    () => planBulkCancelConstruction(deeds, nowMs),
    [deeds, nowMs]
  );

  const feedCount = feedPlan.feedable.length;
  const fixCount = feedPlan.shortOnGrain.length;
  const cancelCount = cancelCandidates.length;

  const fixTargets = useMemo<CoverGrainTarget[]>(
    () =>
      Object.entries(feedPlan.grainNeededByRegion).map(
        ([regionUid, grainNeeded]) => ({ regionUid, grainNeeded })
      ),
    [feedPlan.grainNeededByRegion]
  );

  const totalFeedGrain = feedPlan.feedable.reduce(
    (sum, c) => sum + c.grainCost,
    0
  );

  const feedDisabledReason =
    deeds.length === 0
      ? "No plots in the current selection."
      : feedCount === 0
        ? fixCount > 0
          ? `None of the ${fixCount} ready worksite${fixCount === 1 ? "" : "s"} can be paid for — fix the grain deficit first.`
          : "No selected worksite has workers waiting to be fed."
        : null;

  const fixDisabledReason =
    deeds.length === 0
      ? "No plots in the current selection."
      : fixCount === 0
        ? "Every ready worksite in the selection already has enough grain."
        : null;

  const cancelDisabledReason =
    deeds.length === 0
      ? "No plots in the current selection."
      : cancelCount === 0
        ? "No selected plot has a construction project running."
        : null;

  const handleCancelConfirm = async () => {
    setPending(null);
    const res = await action.cancelConstructions(
      username,
      cancelCandidates.map((c) => ({
        regionUid: c.regionUid,
        deedUid: c.deedUid,
        projectId: c.projectId,
      }))
    );
    if (res.success) onSuccess();
  };

  const handleFeedConfirm = async () => {
    setPending(null);
    const res = await action.feedWorkers(
      username,
      feedPlan.feedable.map((c) => ({
        regionUid: c.regionUid,
        deedUid: c.deed.deed_uid,
        projectId: c.projectId,
      }))
    );
    if (res.success) onSuccess();
  };

  const handleChangeConfirm = async () => {
    if (pending?.type !== "change") return;
    const { option } = pending;
    setPending(null);
    const opName = worksiteConstructionOpName[option.worksite];
    if (!opName) return;
    const res = await action.buildWorksites(
      username,
      option.candidates.map((c) => ({
        regionUid: c.regionUid,
        deedUid: c.deedUid,
      })),
      opName
    );
    if (res.success) onSuccess();
  };

  const changeOption = pending?.type === "change" ? pending.option : null;

  return (
    <Card variant="outlined" sx={{ mb: 1.5 }}>
      <Stack
        direction="row"
        alignItems="center"
        gap={0.5}
        sx={{ px: 1, py: 0.5, cursor: "pointer" }}
        onClick={() => setCollapsed((c) => !c)}
      >
        <IconButton size="small" sx={{ p: 0.25 }}>
          {collapsed ? (
            <ExpandMoreIcon fontSize="small" />
          ) : (
            <ExpandLessIcon fontSize="small" />
          )}
        </IconButton>
        <Typography variant="subtitle2" fontWeight={700}>
          Bulk actions
        </Typography>
        <Typography variant="caption" color="text.secondary">
          · applies to the {deeds.length} selected plot
          {deeds.length === 1 ? "" : "s"} (current filters)
        </Typography>
      </Stack>

      <Collapse in={!collapsed}>
        <Box sx={{ px: 1.25, pb: 1.25 }}>
          <Divider sx={{ mb: 1 }} />

          {/* ── Grain actions ── */}
          <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
            <Tooltip
              title={
                runningLabel(bulkBusyKey.feed) ??
                feedDisabledReason ??
                `Feeds ${feedCount} ready worksite${feedCount === 1 ? "" : "s"} for ${fmt(totalFeedGrain)} GRAIN`
              }
            >
              <span>
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={
                    isRunning(bulkBusyKey.feed) ? (
                      <CircularProgress size={12} color="inherit" />
                    ) : (
                      <RestaurantIcon sx={{ fontSize: "0.9rem !important" }} />
                    )
                  }
                  disabled={action.busy || feedCount === 0}
                  onClick={() => setPending({ type: "feed" })}
                  sx={{ fontSize: "0.7rem" }}
                >
                  {buttonStatus(bulkBusyKey.feed) ??
                    `Feed Workers (${feedCount})`}
                </Button>
              </span>
            </Tooltip>

            <Tooltip
              title={
                fixDisabledReason ??
                `Plans the grain moves needed for ${fixCount} ready worksite${fixCount === 1 ? "" : "s"} — shown for review before anything is broadcast`
              }
            >
              <span>
                <Button
                  size="small"
                  variant="outlined"
                  color="warning"
                  startIcon={
                    <AutoFixHighIcon sx={{ fontSize: "0.9rem !important" }} />
                  }
                  disabled={action.busy || fixCount === 0}
                  onClick={() => setFixOpen(true)}
                  sx={{ fontSize: "0.7rem" }}
                >
                  Fix Grain Deficit ({fixCount})
                </Button>
              </span>
            </Tooltip>

            <Tooltip
              title={
                runningLabel(bulkBusyKey.cancel) ??
                cancelDisabledReason ??
                `Cancels ${cancelCount} running construction${cancelCount === 1 ? "" : "s"} — resources already spent are lost`
              }
            >
              <span>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={
                    isRunning(bulkBusyKey.cancel) ? (
                      <CircularProgress size={12} color="inherit" />
                    ) : (
                      <CancelIcon sx={{ fontSize: "0.9rem !important" }} />
                    )
                  }
                  disabled={action.busy || cancelCount === 0}
                  onClick={() => setPending({ type: "cancel" })}
                  sx={{ fontSize: "0.7rem" }}
                >
                  {buttonStatus(bulkBusyKey.cancel) ??
                    `Cancel Construction (${cancelCount})`}
                </Button>
              </span>
            </Tooltip>
          </Stack>

          {/* ── Change worksite ── */}
          <Divider sx={{ my: 1 }} />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mb: 0.5 }}
          >
            Change worksite — counts are the selected plots whose deed type
            allows it and that are free to switch
          </Typography>
          <Stack direction="row" gap={0.75} flexWrap="wrap">
            {changeOptions.map((option) => {
              const icon = worksiteSelectIconMap[option.worksite];
              const opName = worksiteConstructionOpName[option.worksite];
              const key = opName ? bulkBusyKey.build(opName) : "";
              return (
                <Tooltip
                  key={option.worksite}
                  title={
                    runningLabel(key) ??
                    option.blockedReason ??
                    `Build a ${option.worksite} on ${option.candidates.length} selected plot${option.candidates.length === 1 ? "" : "s"}`
                  }
                >
                  <span>
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={action.busy || option.candidates.length === 0}
                      onClick={() => setPending({ type: "change", option })}
                      startIcon={
                        isRunning(key) ? (
                          <CircularProgress size={12} color="inherit" />
                        ) : icon ? (
                          <Box
                            component="img"
                            src={icon}
                            alt={option.worksite}
                            sx={{
                              width: 20,
                              height: 20,
                              borderRadius: 0.5,
                              objectFit: "cover",
                            }}
                          />
                        ) : undefined
                      }
                      sx={{
                        fontSize: "0.7rem",
                        whiteSpace: "nowrap",
                        "&.Mui-disabled": { opacity: 0.4 },
                      }}
                    >
                      {buttonStatus(key) ??
                        `${option.worksite} (${option.candidates.length})`}
                    </Button>
                  </span>
                </Tooltip>
              );
            })}
          </Stack>

          {/* ── Feedback ── */}
          {action.result?.success && (
            <Alert
              severity="success"
              onClose={action.clearResult}
              sx={{ mt: 1, py: 0 }}
            >
              Done — {action.result.processed} plot
              {action.result.processed === 1 ? "" : "s"} in{" "}
              {action.result.txIds.length} transaction
              {action.result.txIds.length === 1 ? "" : "s"}.
            </Alert>
          )}
          {action.result && !action.result.success && (
            <Alert
              severity="error"
              onClose={action.clearResult}
              sx={{ mt: 1, py: 0 }}
            >
              {action.result.error}
            </Alert>
          )}
        </Box>
      </Collapse>

      {/* Feed confirm */}
      <Dialog
        open={pending?.type === "feed"}
        onClose={() => setPending(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          Feed workers on {feedCount} plots?
        </DialogTitle>
        <DialogContent sx={{ pt: "0 !important" }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            This activates {feedCount} finished worksite
            {feedCount === 1 ? "" : "s"} and pays{" "}
            <strong>{fmt(totalFeedGrain)} GRAIN</strong> from the regions below.
          </Typography>
          <Stack gap={0.25} sx={{ mb: 1 }}>
            {Object.entries(feedPlan.grainSpentByRegion).map(
              ([regionUid, spent]) => (
                <Typography
                  key={regionUid}
                  variant="caption"
                  color="text.secondary"
                >
                  {feedPlan.feedable.find((c) => c.regionUid === regionUid)
                    ?.regionName ?? regionUid}
                  : {fmt(spent)} GRAIN (held {fmt(regionGrain[regionUid] ?? 0)})
                </Typography>
              )
            )}
          </Stack>
          <Stack direction="row" gap={0.5} flexWrap="wrap">
            {feedPlan.feedable.map((c) => (
              <Chip
                key={c.deed.deed_uid}
                label={c.plotLabel}
                size="small"
                variant="outlined"
                sx={{ height: 18, fontSize: "0.62rem" }}
              />
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPending(null)} size="small">
            Back
          </Button>
          <Button
            onClick={handleFeedConfirm}
            size="small"
            variant="contained"
            color="success"
            autoFocus
          >
            Feed {feedCount} worksite{feedCount === 1 ? "" : "s"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel construction confirm */}
      <Dialog
        open={pending?.type === "cancel"}
        onClose={() => setPending(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          Cancel construction on {cancelCount} plot
          {cancelCount === 1 ? "" : "s"}?
        </DialogTitle>
        <DialogContent sx={{ pt: "0 !important" }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            This stops {cancelCount} running construction
            {cancelCount === 1 ? "" : "s"}. Any resources already spent on{" "}
            {cancelCount === 1 ? "it" : "them"} are lost. Finished worksites
            waiting to be fed are not affected.
          </Typography>
          <Stack direction="row" gap={0.5} flexWrap="wrap">
            {cancelCandidates.map((c) => (
              <Chip
                key={c.deedUid}
                label={
                  c.targetWorksite
                    ? `${c.plotLabel} · ${c.targetWorksite}`
                    : c.plotLabel
                }
                size="small"
                variant="outlined"
                sx={{ height: 18, fontSize: "0.62rem" }}
              />
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPending(null)} size="small">
            Back
          </Button>
          <Button
            onClick={handleCancelConfirm}
            size="small"
            variant="contained"
            color="error"
            autoFocus
          >
            Cancel {cancelCount} construction{cancelCount === 1 ? "" : "s"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Change worksite confirm */}
      <Dialog
        open={changeOption !== null}
        onClose={() => setPending(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          Build {changeOption?.worksite} on {changeOption?.candidates.length}{" "}
          plots?
        </DialogTitle>
        <DialogContent sx={{ pt: "0 !important" }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Only compatible plots are included. Any existing worksite on these
            plots is destroyed and unclaimed resources are lost.
          </Typography>
          <Stack direction="row" gap={0.5} flexWrap="wrap">
            {changeOption?.candidates.map((c) => (
              <Chip
                key={c.deedUid}
                label={
                  c.currentWorksite
                    ? `${c.plotLabel} · ${c.currentWorksite}`
                    : c.plotLabel
                }
                size="small"
                variant="outlined"
                sx={{ height: 18, fontSize: "0.62rem" }}
              />
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPending(null)} size="small">
            Back
          </Button>
          <Button
            onClick={handleChangeConfirm}
            size="small"
            variant="contained"
            autoFocus
          >
            Build {changeOption?.candidates.length}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Fix grain deficit — plan first, broadcast only after confirmation */}
      {fixOpen && (
        <FixGrainDeficitDialog
          open={fixOpen}
          username={username}
          strategies={strategies}
          targets={fixTargets}
          subject={`${fixCount} plot${fixCount === 1 ? "" : "s"}`}
          plotLabels={feedPlan.shortOnGrain.map((c) => c.plotLabel)}
          onClose={() => setFixOpen(false)}
          onSuccess={() => {
            setFixOpen(false);
            onSuccess();
          }}
        />
      )}
    </Card>
  );
}
