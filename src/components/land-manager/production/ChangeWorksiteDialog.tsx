"use client";

import { useWorksiteAction } from "@/hooks/useWorksiteAction";
import { actionButtonLabel } from "@/lib/shared/actionPhase";
import {
  canChangeWorksite,
  getWorksitePlotState,
  plotLabelOf,
  staticallyAllowedWorksites,
} from "@/lib/shared/worksiteEligibility";
import { land_under_construction_icon_url } from "@/lib/shared/statics_icon_urls";
import { DeedComplete } from "@/types/deed";
import {
  worksiteConstructionOpName,
  worksiteIconMap,
  worksiteSelectIconMap,
  WorksiteType,
} from "@/types/planner";
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";

interface Props {
  open: boolean;
  deed: DeedComplete;
  username: string;
  /** Shared "now" so this dialog judges construction exactly as the table does. */
  nowMs: number;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Change the building on a single plot, from the Production table's row menu.
 *
 * Every availability rule comes from `worksiteEligibility` — the same module the
 * Worksite page uses — and the broadcast goes through `useWorksiteAction`, the
 * same command. This dialog only chooses; it never decides what is allowed.
 */
export default function ChangeWorksiteDialog({
  open,
  deed,
  username,
  nowMs,
  onClose,
  onSuccess,
}: Props) {
  const action = useWorksiteAction();
  const [selected, setSelected] = useState<WorksiteType | null>(null);

  const state = useMemo(() => getWorksitePlotState(deed, nowMs), [deed, nowMs]);

  // Statically impossible options (wrong terrain / mythic plot) are omitted;
  // options blocked by the current state stay visible but disabled with a
  // reason, matching how the Worksite page presents them.
  const options = useMemo(
    () =>
      staticallyAllowedWorksites(deed).map((worksite) => ({
        worksite,
        check: canChangeWorksite(deed, worksite, nowMs, state),
      })),
    [deed, nowMs, state]
  );

  const plotLabel = plotLabelOf(deed);
  const currentWorksite = state.currentWorksite;
  const currentIcon = currentWorksite
    ? (worksiteIconMap[currentWorksite] ?? land_under_construction_icon_url)
    : land_under_construction_icon_url;

  const selectedCheck = selected
    ? options.find((o) => o.worksite === selected)?.check
    : undefined;
  // Save stays disabled until the choice is both different and currently legal.
  const canSave =
    !action.busy && selected !== null && selectedCheck?.eligible === true;

  async function handleSave() {
    if (!selected) return;
    const opName = worksiteConstructionOpName[selected];
    if (!opName) return;
    const res = await action.buildWorksite(
      username,
      deed.region_uid,
      deed.deed_uid,
      opName
    );
    if (res.success) onSuccess();
  }

  return (
    <Dialog
      open={open}
      onClose={action.busy ? undefined : onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ pb: 1 }}>Change worksite — {plotLabel}</DialogTitle>

      <DialogContent>
        <Stack gap={2}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Currently assigned
            </Typography>
            <Stack direction="row" alignItems="center" gap={1} mt={0.5}>
              <Box
                component="img"
                src={currentIcon}
                alt=""
                aria-hidden="true"
                sx={{
                  width: 32,
                  height: 32,
                  objectFit: "contain",
                  opacity: currentWorksite ? 1 : 0.35,
                }}
              />
              <Typography variant="body2" fontWeight={700}>
                {currentWorksite ?? "Undeveloped — no building assigned"}
              </Typography>
            </Stack>
          </Box>

          {state.isConstruction && (
            <Alert severity="warning">
              {state.isActivelyBuilding
                ? `A ${state.buildingWorksite ?? "construction"} is being built here. Cancel it on the Worksite page before switching.`
                : "Construction finished — feed the workers before switching to another building."}
            </Alert>
          )}

          <Box>
            <Typography variant="caption" color="text.secondary">
              Select a new building
            </Typography>
            {options.length === 0 ? (
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                This plot cannot host any of the selectable worksites.
              </Typography>
            ) : (
              <Stack direction="row" gap={1} flexWrap="wrap" mt={0.75}>
                {options.map(({ worksite, check }) => {
                  const isSelected = selected === worksite;
                  const disabled = action.busy || !check.eligible;
                  return (
                    <Tooltip
                      key={worksite}
                      title={
                        check.eligible
                          ? worksite
                          : `${worksite} — ${check.reason ?? "Unavailable"}`
                      }
                    >
                      {/* span keeps the tooltip alive on a disabled control */}
                      <span>
                        <ButtonBase
                          focusRipple
                          disabled={disabled}
                          aria-label={worksite}
                          aria-pressed={isSelected}
                          onClick={() => setSelected(worksite)}
                          sx={{
                            flexDirection: "column",
                            gap: 0.5,
                            p: 0.75,
                            width: 96,
                            borderRadius: 1,
                            border: 2,
                            borderColor: isSelected
                              ? "primary.main"
                              : "divider",
                            opacity: disabled ? 0.35 : 1,
                            filter: disabled ? "grayscale(1)" : "none",
                            "&:focus-visible": {
                              outline: "2px solid",
                              outlineColor: "primary.main",
                              outlineOffset: 2,
                            },
                          }}
                        >
                          <Box
                            component="img"
                            src={worksiteSelectIconMap[worksite]}
                            alt=""
                            aria-hidden="true"
                            sx={{
                              width: 72,
                              height: 48,
                              objectFit: "cover",
                              borderRadius: 0.5,
                            }}
                          />
                          <Typography
                            variant="caption"
                            sx={{ fontSize: "0.65rem", textAlign: "center" }}
                          >
                            {worksite}
                          </Typography>
                        </ButtonBase>
                      </span>
                    </Tooltip>
                  );
                })}
              </Stack>
            )}
          </Box>

          {selected && currentWorksite && selectedCheck?.eligible && (
            <Alert severity="warning">
              This replaces the existing <strong>{currentWorksite}</strong> with
              a new <strong>{selected}</strong>. The old worksite is destroyed
              and unclaimed resources are lost.
            </Alert>
          )}

          {action.error && <Alert severity="error">{action.error}</Alert>}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} size="small" disabled={action.busy}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          size="small"
          variant="contained"
          disabled={!canSave}
          startIcon={
            action.busy ? (
              <CircularProgress size={14} color="inherit" />
            ) : undefined
          }
        >
          {action.busy
            ? (actionButtonLabel(action.phase) ?? "Saving…")
            : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
