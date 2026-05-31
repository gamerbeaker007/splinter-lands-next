"use client";

import {
  useWorksiteAction,
  WorksiteActionResult,
} from "@/hooks/useWorksiteAction";
import { land_under_construction_icon_url } from "@/lib/shared/statics_icon_urls";
import { getWorksiteLink } from "@/lib/utils/deedUtil";
import { DeedComplete } from "@/types/deed";
import {
  allowedTerrainsByWorksite,
  deedResourceBoostRules,
  resourceWorksiteMap,
  worksiteConstructionOpName,
  worksiteIconMap,
  worksiteSelectIconMap,
  WorksiteType,
} from "@/types/planner";
import {
  Build as BuildIcon,
  Cancel as CancelIcon,
  OpenInNew as OpenInNewIcon,
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

/** Worksite types selectable from the picker (excludes KEEP/CASTLE which are mythic). */
const SELECTABLE_WORKSITES: WorksiteType[] = [
  "Grain Farm",
  "Logging Camp",
  "Ore Mine",
  "Quarry",
  "Research Hut",
  "Aura Lab",
  "Shard Mine",
];

/** Reverse map: op name → WorksiteType, e.g. "worksite_wood_construction" → "Logging Camp" */
const projectTypeToWorksite: Record<string, WorksiteType> = Object.fromEntries(
  Object.entries(worksiteConstructionOpName).map(([ws, op]) => [
    op,
    ws as WorksiteType,
  ])
);

interface Props {
  deed: DeedComplete;
  username: string;
  onSuccess?: () => void;
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
  onClick: () => void;
}

function WorksiteButton({
  worksite,
  isBeingBuilt,
  hasBonus,
  disabled,
  onClick,
}: WorksiteButtonProps) {
  const selectIcon = worksiteSelectIconMap[worksite];

  return (
    <Tooltip
      title={hasBonus ? `${worksite} — +100% bonus production` : worksite}
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
            // Make the disabled state unmistakably greyed out
            "&.Mui-disabled": {
              opacity: 0.3,
              filter: "grayscale(1)",
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
              {/* +100% bonus chip overlaid inside image, bottom-right */}
              {hasBonus && (
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

export default function WorksitePlotCard({ deed, username, onSuccess }: Props) {
  const action = useWorksiteAction();
  // Capture mount time once to avoid impure renders
  const [now] = useState(() => Date.now());
  // Pending confirm: set when the user clicks a button, cleared on dismiss
  const [pendingAction, setPendingAction] = useState<
    { type: "build"; worksite: WorksiteType } | { type: "cancel" } | null
  >(null);

  // worksiteDetail == null → undeveloped (buttons enabled)
  // worksiteDetail != null && is_construction == true → actively building (buttons disabled)
  // worksiteDetail != null && is_construction == false → developed (buttons enabled)
  const isActivelyBuilding = deed.worksiteDetail?.is_construction === true;
  const isUndeveloped = !deed.worksiteDetail;
  const currentWorksite =
    (deed.worksiteDetail?.worksite_type as WorksiteType | null | undefined) ??
    null;
  // During construction, worksiteDetail.worksite_type is empty — derive target from project_type
  const buildingWorksite: WorksiteType | null = isActivelyBuilding
    ? (projectTypeToWorksite[deed.worksiteDetail?.project_type ?? ""] ?? null)
    : ((deed.worksiteDetail?.worksite_type as
        | WorksiteType
        | null
        | undefined) ?? null);

  // Inline construction progress values
  const { constructionPct, constructionRemaining } = useMemo(() => {
    if (!isActivelyBuilding || !deed.worksiteDetail)
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
  }, [isActivelyBuilding, deed.worksiteDetail, now]);

  // Worksites that get a production bonus for this plot's status
  const boostWorksites: WorksiteType[] = useMemo(() => {
    const rules = deedResourceBoostRules as Partial<
      Record<string, WorksiteType[]>
    >;
    return rules[deed.plot_status ?? ""] ?? [];
  }, [deed.plot_status]);

  // Filter selectable worksites: remove current built worksite + terrain restriction
  const allowedWorksites = useMemo(
    () =>
      SELECTABLE_WORKSITES.filter((ws) => {
        // Hide the currently built worksite — it's already there, not a switch target
        if (!isActivelyBuilding && currentWorksite === ws) return false;
        const allowed = allowedTerrainsByWorksite[ws];
        if (!allowed) return true;
        if (!deed.deed_type) return true;
        return allowed.includes(deed.deed_type.toLowerCase());
      }),
    [deed.deed_type, currentWorksite, isActivelyBuilding]
  );

  const handleBuildWorksite = useCallback((worksite: WorksiteType) => {
    setPendingAction({ type: "build", worksite });
  }, []);

  const handleCancelClick = useCallback(() => {
    setPendingAction({ type: "cancel" });
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

  const plotLabel = `P-${deed.region_number}-${deed.tract_number}-${deed.plot_number}`;

  const worksiteIcon = isUndeveloped
    ? land_under_construction_icon_url
    : currentWorksite && worksiteIconMap[currentWorksite]
      ? worksiteIconMap[currentWorksite]
      : land_under_construction_icon_url;

  const worksiteLabel = isUndeveloped
    ? "Undeveloped"
    : (currentWorksite ?? (isActivelyBuilding ? "" : "—"));

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

        {/* 4. Under-construction inline progress */}
        {isActivelyBuilding && (
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

        {/* 5. Worksite selector buttons — takes remaining space, scrollable */}
        <Box sx={{ flex: 1, minWidth: 0, overflowX: "auto" }}>
          <Stack direction="row" gap={0.5} sx={{ flexWrap: "nowrap" }}>
            {allowedWorksites.map((ws) => (
              <WorksiteButton
                key={ws}
                worksite={ws}
                isBeingBuilt={isActivelyBuilding && buildingWorksite === ws}
                hasBonus={boostWorksites.includes(ws)}
                disabled={action.busy || isActivelyBuilding}
                onClick={() => handleBuildWorksite(ws)}
              />
            ))}
          </Stack>
        </Box>

        {/* 6. Divider + Cancel button — only while actively building */}
        {isActivelyBuilding && (
          <>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.25 }} />
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={
                action.busy ? (
                  <CircularProgress size={12} />
                ) : (
                  <CancelIcon sx={{ fontSize: "0.9rem !important" }} />
                )
              }
              onClick={handleCancelClick}
              disabled={action.busy || deed.worksiteDetail?.project_id == null}
              sx={{ flexShrink: 0, whiteSpace: "nowrap", fontSize: "0.65rem" }}
            >
              Cancel
            </Button>
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
            : `Build ${pendingAction?.type === "build" ? pendingAction.worksite : ""}?`}
        </DialogTitle>
        <DialogContent sx={{ pt: "0 !important" }}>
          <Typography variant="body2" color="text.secondary">
            {pendingAction?.type === "cancel" ? (
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
