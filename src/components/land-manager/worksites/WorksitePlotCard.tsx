"use client";

import {
  useWorksiteAction,
  worksiteBusyKey,
  WorksiteActionResult,
} from "@/hooks/useWorksiteAction";
import { actionButtonLabel, actionPhaseLabel } from "@/lib/shared/actionPhase";
import { land_under_construction_icon_url } from "@/lib/shared/statics_icon_urls";
import {
  canCancelConstruction,
  canChangeWorksite,
  canFeedWorkers,
  canFixGrainDeficit,
  getWorksitePlotState,
  plotLabelOf,
  staticallyAllowedWorksites,
} from "@/lib/shared/worksiteEligibility";
import { getWorksiteLink } from "@/lib/utils/deedUtil";
import { DeedComplete } from "@/types/deed";
import {
  deedResourceBoostRules,
  resourceWorksiteMap,
  worksiteConstructionOpName,
  worksiteIconMap,
  worksiteSelectIconMap,
  WorksiteType,
} from "@/types/planner";
import {
  AutoFixHigh as AutoFixHighIcon,
  Build as BuildIcon,
  Cancel as CancelIcon,
  OpenInNew as OpenInNewIcon,
  Restaurant as RestaurantIcon,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useMemo, useState } from "react";
import FixGrainDeficitDialog from "@/components/land-manager/worksites/FixGrainDeficitDialog";
import { MakeHarvestableStrategy } from "@/types/landManager";

interface Props {
  deed: DeedComplete;
  username: string;
  onSuccess?: () => void;
  /** Grain currently held in this plot's region — gates the Feed workers button. */
  regionGrain?: number;
  /** Configured make-harvestable strategy order — used by the Fix grain deficit proposal. */
  strategies: MakeHarvestableStrategy[];
  /**
   * Shared "now" for construction/eligibility checks. Passed down from the page
   * so the card and the bulk action counts judge against the same instant.
   */
  nowMs?: number;
}

function formatDuration(ms: number): string {
  if (ms <= 0) return "0m";
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

interface WorksiteButtonProps {
  worksite: WorksiteType;
  isBeingBuilt: boolean;
  hasBonus: boolean;
  disabled: boolean;
  /** Why the option is unavailable right now — shown instead of the plain name. */
  disabledReason?: string;
  /** This worksite's build is in flight — overlay a spinner on its icon. */
  loading?: boolean;
  /** Phase text for the running build ("Signing…", "Validating…"). */
  loadingLabel?: string | null;
  onClick: () => void;
}

function WorksiteButton({
  worksite,
  isBeingBuilt,
  hasBonus,
  disabled,
  disabledReason,
  loading,
  loadingLabel,
  onClick,
}: WorksiteButtonProps) {
  const selectIcon = worksiteSelectIconMap[worksite];

  return (
    <Tooltip
      title={
        loading
          ? `${worksite} — ${loadingLabel ?? "Working…"}`
          : disabled && disabledReason
            ? `${worksite} — ${disabledReason}`
            : hasBonus
              ? `${worksite} — +100% bonus production`
              : worksite
      }
    >
      {/* span wrapper required so Tooltip works on disabled button */}
      <span>
        <Button
          size="small"
          variant={isBeingBuilt ? "contained" : "outlined"}
          onClick={onClick}
          disabled={disabled}
          sx={{
            p: 0.25,
            minWidth: 0,
            borderColor: hasBonus && !isBeingBuilt ? "success.main" : undefined,
            bgcolor: isBeingBuilt ? "warning.dark" : undefined,
            // Make the disabled state unmistakably greyed out — except while
            // this button's own action runs, where the spinner must stay legible.
            "&.Mui-disabled": {
              opacity: loading ? 1 : 0.3,
              filter: loading ? "none" : "grayscale(1)",
            },
            "&:hover": { bgcolor: isBeingBuilt ? undefined : "action.hover" },
          }}
        >
          {selectIcon && (
            <Box
              sx={{
                position: "relative",
                width: 36,
                height: 36,
                flexShrink: 0,
              }}
            >
              <Box
                component="img"
                src={selectIcon}
                alt={worksite}
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 0.5,
                  objectFit: "cover",
                  display: "block",
                }}
              />
              {/* Spinner overlaid on the icon while this build is in flight */}
              {loading && (
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "rgba(0,0,0,0.55)",
                    borderRadius: 0.5,
                  }}
                >
                  <CircularProgress size={18} sx={{ color: "common.white" }} />
                </Box>
              )}
              {/* +100% bonus chip overlaid inside image, bottom-right */}
              {hasBonus && !loading && (
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 2,
                    right: 2,
                    bgcolor: "success.main",
                    borderRadius: 0.5,
                    px: 0.4,
                    lineHeight: 1.4,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "0.45rem",
                      color: "white",
                      fontWeight: 700,
                      lineHeight: 1.4,
                    }}
                  >
                    +100%
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Button>
      </span>
    </Tooltip>
  );
}

export default function WorksitePlotCard({
  deed,
  username,
  onSuccess,
  regionGrain,
  strategies,
  nowMs,
}: Props) {
  const action = useWorksiteAction();
  // Only the pressed button spins; the others are disabled while it runs.
  const isRunning = (key: string) => key !== "" && action.busyKey === key;
  const buttonStatus = (key: string) =>
    isRunning(key) ? actionButtonLabel(action.phase) : null;
  const runningLabel = (key: string) =>
    isRunning(key) ? actionPhaseLabel(action.phase) : null;

  // Capture mount time once to avoid impure renders (unless the page supplies one)
  const [mountedNow] = useState(() => Date.now());
  const now = nowMs ?? mountedNow;
  // Fix-grain-deficit proposal dialog (shown when the region lacks grain to feed)
  const [coverOpen, setCoverOpen] = useState(false);
  // Pending confirm: set when the user clicks a button, cleared on dismiss
  const [pendingAction, setPendingAction] = useState<
    | { type: "build"; worksite: WorksiteType }
    | { type: "cancel" }
    | { type: "feed" }
    | null
  >(null);

  // All state flags come from the shared eligibility helper, so this card, the
  // bulk action bar and the executed ops can never disagree.
  const state = useMemo(() => getWorksitePlotState(deed, now), [deed, now]);
  const {
    isUndeveloped,
    isConstruction,
    isActivelyBuilding,
    isMythic,
    currentWorksite,
    buildingWorksite,
    isReadyToFeed,
    grainCost,
  } = state;

  const feedCheck = canFeedWorkers(deed, regionGrain ?? 0, now, state);
  const fixCheck = canFixGrainDeficit(deed, regionGrain ?? 0, now, state);
  const cancelCheck = canCancelConstruction(deed, now, state);

  const plotLabel = plotLabelOf(deed);

  // Inline construction progress values. Shown for the whole construction —
  // when finished-but-unfed, elapsed >= total so the bar reads 100% and 0m left.
  const { constructionPct, constructionRemaining } = useMemo(() => {
    if (!isConstruction || !deed.worksiteDetail)
      return { constructionPct: 0, constructionRemaining: "" };
    const wd = deed.worksiteDetail;
    const start = wd.project_created_date
      ? new Date(wd.project_created_date).getTime()
      : null;
    const end = wd.projected_end ? new Date(wd.projected_end).getTime() : null;
    if (start && end) {
      const total = end - start;
      const elapsed = now - start;
      const pct =
        total > 0 ? Math.min(100, Math.max(0, (elapsed / total) * 100)) : 0;
      return {
        constructionPct: pct,
        constructionRemaining: formatDuration(Math.max(0, end - now)),
      };
    }
    if (wd.hours_to_completion != null) {
      return {
        constructionPct: 0,
        constructionRemaining: formatDuration(
          wd.hours_to_completion * 3_600_000
        ),
      };
    }
    return { constructionPct: 0, constructionRemaining: "" };
  }, [isConstruction, deed.worksiteDetail, now]);

  // Worksites that get a production bonus for this plot's status
  const boostWorksites: WorksiteType[] = useMemo(() => {
    const rules = deedResourceBoostRules as Partial<
      Record<string, WorksiteType[]>
    >;
    return rules[deed.plot_status ?? ""] ?? [];
  }, [deed.plot_status]);

  // Only *statically* impossible worksites are hidden (wrong deed type). Options
  // blocked by the current state stay visible but disabled, with a reason — so
  // the button set doesn't shuffle as construction starts and finishes.
  const worksiteOptions = useMemo(
    () =>
      staticallyAllowedWorksites(deed).map((ws) => ({
        worksite: ws,
        check: canChangeWorksite(deed, ws, now, state),
      })),
    [deed, now, state]
  );

  const handleBuildWorksite = useCallback((worksite: WorksiteType) => {
    setPendingAction({ type: "build", worksite });
  }, []);

  const handleCancelClick = useCallback(() => {
    setPendingAction({ type: "cancel" });
  }, []);

  const handleFeedClick = useCallback(() => {
    setPendingAction({ type: "feed" });
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!pendingAction) return;
    setPendingAction(null);
    if (pendingAction.type === "build") {
      const opName = worksiteConstructionOpName[pendingAction.worksite];
      if (!opName) return;
      const res: WorksiteActionResult = await action.buildWorksite(
        username,
        deed.region_uid,
        deed.deed_uid,
        opName
      );
      if (res.success) onSuccess?.();
    } else if (pendingAction.type === "feed") {
      const projectId = deed.worksiteDetail?.project_id;
      if (!projectId) return;
      const res = await action.feedWorkers(
        username,
        deed.region_uid,
        deed.deed_uid,
        projectId
      );
      if (res.success) onSuccess?.();
    } else {
      const projectId = deed.worksiteDetail?.project_id;
      if (!projectId) return;
      const res = await action.cancelConstruction(
        username,
        deed.region_uid,
        deed.deed_uid,
        projectId
      );
      if (res.success) onSuccess?.();
    }
  }, [
    pendingAction,
    action,
    username,
    deed.region_uid,
    deed.deed_uid,
    deed.worksiteDetail?.project_id,
    onSuccess,
  ]);

  const handleDialogClose = useCallback(() => setPendingAction(null), []);

  const worksiteIcon = isUndeveloped
    ? land_under_construction_icon_url
    : currentWorksite && worksiteIconMap[currentWorksite]
      ? worksiteIconMap[currentWorksite]
      : land_under_construction_icon_url;

  const worksiteLabel = isUndeveloped
    ? "Undeveloped"
    : (currentWorksite ?? (isConstruction ? "" : "—"));

  return (
    <Card variant="outlined" sx={{ mb: 0.75 }}>
      {/* ── Single horizontal row ── */}
      <Stack
        direction="row"
        alignItems="center"
        gap={1}
        sx={{ px: 1.25, py: 0.75, minHeight: 52 }}
        flexWrap="nowrap"
      >
        {/* 0. External link to Splinterlands worksite page */}
        <Tooltip title="Manage in Splinterlands">
          <IconButton
            size="small"
            component="a"
            href={getWorksiteLink(deed.region_number, deed.plot_id)}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              flexShrink: 0,
              p: 0.25,
              color: "text.disabled",
              "&:hover": { color: "primary.main" },
            }}
          >
            <OpenInNewIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
        <Stack
          direction="row"
          alignItems="center"
          gap={0.5}
          sx={{ flexShrink: 0 }}
          flexWrap="wrap"
        >
          <Typography
            variant="caption"
            fontWeight={700}
            sx={{ whiteSpace: "nowrap" }}
          >
            {plotLabel}
          </Typography>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <Box
            component="img"
            src={worksiteIcon}
            alt={worksiteLabel}
            sx={{
              width: 32,
              height: 32,
              objectFit: "contain",
              flexShrink: 0,
              opacity: isUndeveloped ? 0.35 : 1,
            }}
          />
          <Typography
            variant="caption"
            color={isUndeveloped ? "text.disabled" : "text.secondary"}
            sx={{ whiteSpace: "nowrap" }}
          >
            {worksiteLabel}
          </Typography>
          {deed.rarity && (
            <Chip
              label={deed.rarity}
              size="small"
              sx={{ height: 16, fontSize: "0.6rem" }}
            />
          )}
          {deed.deed_type && (
            <Chip
              label={deed.deed_type}
              size="small"
              variant="outlined"
              sx={{ height: 16, fontSize: "0.6rem" }}
            />
          )}
          {deed.plot_status && deed.plot_status !== "natural" && (
            <Chip
              label={deed.plot_status}
              size="small"
              color={
                deed.plot_status === "magical"
                  ? "secondary"
                  : deed.plot_status === "occupied"
                    ? "warning"
                    : deed.plot_status === "kingdom"
                      ? "success"
                      : "default"
              }
              sx={{ height: 16, fontSize: "0.6rem" }}
            />
          )}
          {deed.magic_type && (
            <Chip
              label={deed.magic_type}
              size="small"
              color="info"
              variant="outlined"
              sx={{ height: 16, fontSize: "0.6rem" }}
            />
          )}
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
        </Stack>

        {/* 3. Stats: rewards/h + PP */}
        {deed.worksiteDetail?.rewards_per_hour != null &&
          deed.worksiteDetail.rewards_per_hour > 0 && (
            <Chip
              label={`${deed.worksiteDetail.rewards_per_hour.toFixed(3)} ${
                deed.worksiteDetail.token_symbol ??
                (currentWorksite ? resourceWorksiteMap[currentWorksite] : "")
              }/h`}
              size="small"
              variant="outlined"
              sx={{ height: 18, fontSize: "0.62rem", flexShrink: 0 }}
            />
          )}
        {deed.stakingDetail?.total_base_pp_after_cap != null &&
          deed.stakingDetail.total_base_pp_after_cap > 0 && (
            <Chip
              label={`${(deed.stakingDetail.total_base_pp_after_cap / 1_000).toFixed(1)}k PP`}
              size="small"
              variant="outlined"
              color="primary"
              sx={{ height: 18, fontSize: "0.62rem", flexShrink: 0 }}
            />
          )}

        {/* 4. Construction inline progress (also shown at 100% / 0m when the
            build is finished but the workers haven't been fed yet) */}
        {isConstruction && (
          <Stack
            direction="row"
            alignItems="center"
            gap={0.5}
            sx={{ flexShrink: 0 }}
          >
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

            <BuildIcon sx={{ fontSize: 13, color: "warning.main" }} />
            <Box sx={{ width: 68 }}>
              <LinearProgress
                variant="determinate"
                value={constructionPct}
                sx={{ height: 5, borderRadius: 1 }}
              />
            </Box>
            {constructionRemaining && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ whiteSpace: "nowrap", fontSize: "0.6rem" }}
              >
                {constructionRemaining}
              </Typography>
            )}
            {/* Target worksite icon + name after the timer */}
            {buildingWorksite && (
              <>
                <Typography
                  variant="caption"
                  color="text.disabled"
                  sx={{ fontSize: "0.6rem" }}
                >
                  →
                </Typography>
                {worksiteIconMap[buildingWorksite] && (
                  <Box
                    component="img"
                    src={worksiteIconMap[buildingWorksite]}
                    alt={buildingWorksite}
                    sx={{
                      width: 18,
                      height: 18,
                      objectFit: "contain",
                      flexShrink: 0,
                    }}
                  />
                )}
                <Typography
                  variant="caption"
                  color="warning.main"
                  sx={{ whiteSpace: "nowrap", fontSize: "0.6rem" }}
                >
                  {buildingWorksite}
                </Typography>
              </>
            )}
          </Stack>
        )}
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* 5. Worksite selector buttons — takes remaining space, scrollable.
            Mythic (kingdom) deeds have a fixed worksite, so no swap UI. */}
        <Box sx={{ flex: 1, minWidth: 0, overflowX: "auto" }}>
          {isMythic ? (
            <Typography
              variant="caption"
              color="text.disabled"
              sx={{ fontStyle: "italic", fontSize: "0.65rem" }}
            >
              Mythic deed — No worksite
            </Typography>
          ) : (
            <Stack direction="row" gap={0.5} sx={{ flexWrap: "nowrap" }}>
              {worksiteOptions.map(({ worksite, check }) => {
                const opName = worksiteConstructionOpName[worksite];
                const key = opName ? worksiteBusyKey.build(opName) : "";
                return (
                  <WorksiteButton
                    key={worksite}
                    worksite={worksite}
                    isBeingBuilt={
                      isConstruction && buildingWorksite === worksite
                    }
                    hasBonus={boostWorksites.includes(worksite)}
                    disabled={action.busy || !check.eligible}
                    disabledReason={
                      action.busy ? "An action is running…" : check.reason
                    }
                    loading={isRunning(key)}
                    loadingLabel={runningLabel(key)}
                    onClick={() => handleBuildWorksite(worksite)}
                  />
                );
              })}
            </Stack>
          )}
        </Box>

        {/* 6-7. Dynamic actions. These stay mounted even when unavailable and
            explain why in their tooltip, so buttons don't appear/disappear as
            construction progresses. Mythic plots have no worksite at all, so
            their actions are statically impossible and stay hidden. */}
        {!isMythic && (
          <>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.25 }} />
            <Tooltip
              title={
                runningLabel(worksiteBusyKey.cancel) ??
                (cancelCheck.eligible
                  ? "Cancel the running construction"
                  : (cancelCheck.reason ?? ""))
              }
            >
              <span style={{ flexShrink: 0 }}>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={
                    isRunning(worksiteBusyKey.cancel) ? (
                      <CircularProgress size={12} color="inherit" />
                    ) : (
                      <CancelIcon sx={{ fontSize: "0.9rem !important" }} />
                    )
                  }
                  onClick={handleCancelClick}
                  disabled={action.busy || !cancelCheck.eligible}
                  sx={{
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                    fontSize: "0.65rem",
                  }}
                >
                  {buttonStatus(worksiteBusyKey.cancel) ?? "Cancel"}
                </Button>
              </span>
            </Tooltip>

            <Tooltip
              title={
                runningLabel(worksiteBusyKey.feed) ??
                (feedCheck.eligible
                  ? `Feed the workers — pays ${grainCost.toLocaleString("en-US")} GRAIN from the region`
                  : (feedCheck.reason ?? ""))
              }
            >
              {/* span wrapper so the tooltip works on a disabled button */}
              <span style={{ flexShrink: 0 }}>
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={
                    isRunning(worksiteBusyKey.feed) ? (
                      <CircularProgress size={12} color="inherit" />
                    ) : (
                      <RestaurantIcon sx={{ fontSize: "0.9rem !important" }} />
                    )
                  }
                  onClick={handleFeedClick}
                  disabled={action.busy || !feedCheck.eligible}
                  sx={{ whiteSpace: "nowrap", fontSize: "0.65rem" }}
                >
                  {buttonStatus(worksiteBusyKey.feed) ?? "Feed workers"}
                </Button>
              </span>
            </Tooltip>

            {/* Not enough grain in the region → propose moving grain in from
                other regions (pool → transfer → swap → buy with DEC). Only fixes
                the deficit; feeding is the separate Feed workers button above. */}
            <Tooltip
              title={
                fixCheck.eligible
                  ? "Move grain from your other regions to cover the worker food (pool → transfer → swap → buy with DEC). Then use Feed workers."
                  : (fixCheck.reason ?? "")
              }
            >
              <span style={{ flexShrink: 0 }}>
                <Button
                  size="small"
                  variant="outlined"
                  color="warning"
                  startIcon={
                    <AutoFixHighIcon sx={{ fontSize: "0.9rem !important" }} />
                  }
                  onClick={() => setCoverOpen(true)}
                  disabled={action.busy || !fixCheck.eligible}
                  sx={{ whiteSpace: "nowrap", fontSize: "0.65rem" }}
                >
                  Fix grain deficit
                </Button>
              </span>
            </Tooltip>
          </>
        )}
      </Stack>

      {/* Confirm dialog */}
      <Dialog
        open={pendingAction !== null}
        onClose={handleDialogClose}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          {pendingAction?.type === "cancel"
            ? "Cancel construction?"
            : pendingAction?.type === "feed"
              ? "Feed workers?"
              : `Build ${pendingAction?.type === "build" ? pendingAction.worksite : ""}?`}
        </DialogTitle>
        <DialogContent sx={{ pt: "0 !important" }}>
          <Typography variant="body2" color="text.secondary">
            {pendingAction?.type === "feed" ? (
              <>
                Feed the workers on <strong>{plotLabel}</strong> to activate
                this worksite?
                <br />
                This pays{" "}
                <strong>{grainCost.toLocaleString("en-US")} GRAIN</strong> from
                the region (held:{" "}
                {(regionGrain ?? 0).toLocaleString("en-US", {
                  maximumFractionDigits: 0,
                })}
                ).
              </>
            ) : pendingAction?.type === "cancel" ? (
              <>
                Cancel the ongoing construction of{" "}
                <strong>{buildingWorksite ?? "this worksite"}</strong> on{" "}
                <strong>{plotLabel}</strong>?
                <br />
                You will lose any resources already spent.
              </>
            ) : pendingAction?.type === "build" &&
              currentWorksite &&
              !isActivelyBuilding ? (
              <>
                This will replace the existing{" "}
                <strong>{currentWorksite}</strong> on{" "}
                <strong>{plotLabel}</strong> with a new{" "}
                <strong>{pendingAction.worksite}</strong>.
                <br />
                The old worksite will be destroyed.
                <br />
                Unclaimed resources will be lost. Proceed?
              </>
            ) : (
              <>
                Start building a{" "}
                <strong>
                  {pendingAction?.type === "build"
                    ? pendingAction.worksite
                    : ""}
                </strong>{" "}
                on <strong>{plotLabel}</strong>?
              </>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} size="small">
            Back
          </Button>
          <Button
            onClick={handleConfirm}
            size="small"
            variant="contained"
            color={pendingAction?.type === "cancel" ? "error" : "primary"}
            autoFocus
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Fix-grain-deficit proposal dialog (moves grain in; does not feed) */}
      {isReadyToFeed && coverOpen && (
        <FixGrainDeficitDialog
          open={coverOpen}
          username={username}
          strategies={strategies}
          targets={[{ regionUid: deed.region_uid, grainNeeded: grainCost }]}
          subject={plotLabel}
          onClose={() => setCoverOpen(false)}
          onSuccess={() => {
            setCoverOpen(false);
            onSuccess?.();
          }}
        />
      )}

      {/* Feedback alert (below the row) */}
      {(action.result || action.error) && (
        <Box sx={{ px: 1.25, pb: 0.75 }}>
          {action.result && (
            <Alert
              severity={action.result.success ? "success" : "error"}
              onClose={action.clearResult}
              sx={{ py: 0 }}
            >
              {action.result.success
                ? "Done! Reload to see updated status."
                : action.result.error}
            </Alert>
          )}
          {!action.result && action.error && (
            <Alert severity="error" sx={{ py: 0 }}>
              {action.error}
            </Alert>
          )}
        </Box>
      )}
    </Card>
  );
}
