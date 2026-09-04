"use client";

import CustomPlanEditor, {
  draftsToItems,
} from "@/components/land-manager/harvest/CustomPlanEditor";
import { useCustomPlanAction } from "@/hooks/useCustomPlanAction";
import {
  deleteCustomPlan,
  getCustomPlans,
  renameCustomPlan,
  saveCustomPlan,
} from "@/lib/backend/actions/land-manager/custom-plan-actions";
import {
  getBulkRegionData,
  getDecBalance,
  getLandPools,
  getPlayerPoolPositions,
} from "@/lib/backend/actions/land-manager/overview-actions";
import { NATURAL_RESOURCES } from "@/lib/shared/statics";
import {
  CustomPlan,
  CustomPlanRowDraft,
  CustomPlanValidationResult,
  MAX_CUSTOM_PLAN_NAME_LENGTH,
  MAX_CUSTOM_PLANS_PER_PLAYER,
  MAX_OPS_PER_BROADCAST,
} from "@/types/landManager";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import { SplLandPool, SplPlayerPoolPosition } from "@/types/spl/landPools";
import { Add, Delete, DriveFileRenameOutline, Save } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
} from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  username: string;
  visibleRegions: SplProductionOverviewRegion[];
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CustomPlanDialog({
  username,
  visibleRegions,
  open,
  onClose,
  onSuccess,
}: Props) {
  // ── Data state ──────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(open);
  const [savedPlans, setSavedPlans] = useState<CustomPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [balances, setBalances] = useState<
    Record<string, Record<string, number>>
  >({});
  const [decBalance, setDecBalance] = useState(0);
  const [pools, setPools] = useState<SplLandPool[]>([]);
  const [poolPositions, setPoolPositions] = useState<
    Record<string, SplPlayerPoolPosition>
  >({});

  // ── Editor state ─────────────────────────────────────────────────────────────
  const [planName, setPlanName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [editorKey, setEditorKey] = useState(0); // force editor remount on plan switch
  const [validationResult, setValidationResult] =
    useState<CustomPlanValidationResult>({ rows: [], status: "empty" });
  const currentRowsRef = useRef<CustomPlanRowDraft[]>([]);
  const [multiplierText, setMultiplierText] = useState("1");

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveBusy, setSaveBusy] = useState(false);
  const [renameMode, setRenameMode] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [unsavedDialogOpen, setUnsavedDialogOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ── Action hook ───────────────────────────────────────────────────────────────
  const action = useCustomPlanAction({ username, visibleRegions, onSuccess });

  // ── Load data on open ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const enabledUids = visibleRegions.map((r) => r.region_uid);

    Promise.all([
      getCustomPlans(),
      getBulkRegionData(enabledUids, false),
      getLandPools(),
      getDecBalance(username),
      getPlayerPoolPositions(username, NATURAL_RESOURCES, false),
    ]).then(([plansRes, bulkData, poolsData, dec, positions]) => {
      if (plansRes.error) setLoadError(plansRes.error);
      else setLoadError(null);
      const plans = plansRes.plans ?? [];
      setSavedPlans(plans);
      setBalances(bulkData.balances);
      setPools(poolsData.pools);
      setDecBalance(dec);
      setPoolPositions(positions);

      if (plans.length > 0) {
        const first = plans[0];
        setSelectedPlanId(first.id);
        setPlanName(first.name);
      } else {
        setSelectedPlanId(null);
        setPlanName("");
      }
      setIsDirty(false);
      setMultiplierText("1");
      setEditorKey((k) => k + 1);
      setLoading(false);
    });
  }, [open, username, visibleRegions]);

  // ── Select a saved plan ───────────────────────────────────────────────────────
  function selectPlan(planId: string | null) {
    setSelectedPlanId(planId);
    const plan = savedPlans.find((p) => p.id === planId);
    setPlanName(plan?.name ?? "");
    setIsDirty(false);
    setSaveError(null);
    setEditorKey((k) => k + 1);
  }

  // ── New plan ──────────────────────────────────────────────────────────────────
  function newPlan() {
    setSelectedPlanId(null);
    setPlanName("");
    setIsDirty(false);
    setSaveError(null);
    setEditorKey((k) => k + 1);
  }

  // ── Editor callbacks ──────────────────────────────────────────────────────────
  const handleValidationChange = useCallback(
    (result: CustomPlanValidationResult, rows: CustomPlanRowDraft[]) => {
      setValidationResult(result);
      currentRowsRef.current = rows;
    },
    []
  );

  const handleDirtyChange = useCallback((dirty: boolean) => {
    setIsDirty(dirty);
  }, []);

  // ── Save ──────────────────────────────────────────────────────────────────────
  async function doSave(): Promise<{ ok: boolean; newId?: string }> {
    const trimmed = planName.trim();
    if (!trimmed) {
      setNameError("Plan name is required");
      return { ok: false };
    }
    const rows = currentRowsRef.current;
    if (rows.length === 0) {
      setSaveError("Plan must have at least one row");
      return { ok: false };
    }
    setSaveBusy(true);
    setSaveError(null);
    const res = await saveCustomPlan({
      id: selectedPlanId ?? undefined,
      name: trimmed,
      items: draftsToItems(rows),
    });
    setSaveBusy(false);
    if (res.error) {
      setSaveError(res.error);
      return { ok: false };
    }
    const plan = res.plan!;
    setSavedPlans((prev) => {
      const idx = prev.findIndex((p) => p.id === plan.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = plan;
        return next;
      }
      return [...prev, plan];
    });
    setSelectedPlanId(plan.id);
    setPlanName(plan.name);
    setIsDirty(false);
    return { ok: true, newId: plan.id };
  }

  // ── Rename ────────────────────────────────────────────────────────────────────
  async function doRename() {
    if (!selectedPlanId) return;
    const trimmed = renameValue.trim();
    if (!trimmed) return;
    const res = await renameCustomPlan(selectedPlanId, trimmed);
    if (res.error) {
      setSaveError(res.error);
      return;
    }
    setSavedPlans((prev) =>
      prev.map((p) => (p.id === selectedPlanId ? { ...p, name: trimmed } : p))
    );
    setPlanName(trimmed);
    setRenameMode(false);
    setRenameValue("");
  }

  // ── Delete ────────────────────────────────────────────────────────────────────
  async function doDelete() {
    if (!selectedPlanId) return;
    setDeleteConfirmOpen(false);
    await deleteCustomPlan(selectedPlanId);
    const remaining = savedPlans.filter((p) => p.id !== selectedPlanId);
    setSavedPlans(remaining);
    if (remaining.length > 0) {
      selectPlan(remaining[0].id);
    } else {
      newPlan();
    }
  }

  // ── Execute ───────────────────────────────────────────────────────────────────
  async function doExecute(withSave: boolean) {
    if (withSave) {
      const { ok } = await doSave();
      if (!ok) return;
    }
    // No extra confirmation dialog — every row is validated live in the editor
    // and `execute` re-validates against freshly fetched balances before it
    // broadcasts anything.
    await action.execute(
      currentRowsRef.current,
      false,
      Number.parseFloat(multiplierText)
    );
  }

  // ── Unsaved dialog handling ───────────────────────────────────────────────────
  function tryExecute() {
    if (isDirty) {
      setUnsavedDialogOpen(true);
      return;
    }
    doExecute(false);
  }

  async function handleUnsavedChoice(
    choice: "cancel" | "save_only" | "execute" | "save_execute"
  ) {
    setUnsavedDialogOpen(false);
    if (choice === "cancel") return;
    if (choice === "save_only") {
      doSave();
      return;
    }
    if (choice === "execute") {
      doExecute(false);
      return;
    }
    if (choice === "save_execute") {
      doExecute(true);
    }
  }

  // ── Derived ───────────────────────────────────────────────────────────────────
  const canSave =
    planName.trim().length > 0 &&
    validationResult.status !== "empty" &&
    validationResult.status !== "incomplete" &&
    !saveBusy;

  const canExecute =
    validationResult.status === "valid" && !action.busy && !saveBusy;

  const multiplier = Number.parseFloat(multiplierText);
  const multiplierValid = Number.isFinite(multiplier) && multiplier > 0;

  const effectiveCanExecute = canExecute && multiplierValid;

  const selectedPlan = savedPlans.find((p) => p.id === selectedPlanId) ?? null;

  return (
    <>
      <Dialog
        open={open}
        onClose={action.busy ? undefined : onClose}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Custom Plan</DialogTitle>

        <DialogContent dividers>
          {loading && (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          )}

          {!loading && (
            <>
              {loadError && (
                <Alert severity="error" sx={{ mb: 1.5 }}>
                  {loadError}
                </Alert>
              )}

              {/* Plan selector bar */}
              <Stack
                direction="row"
                gap={1}
                alignItems="center"
                flexWrap="wrap"
                mb={2}
              >
                {savedPlans.length > 0 && (
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Saved plan</InputLabel>
                    <Select
                      value={selectedPlanId ?? ""}
                      label="Saved plan"
                      onChange={(e) => selectPlan(e.target.value || null)}
                    >
                      {savedPlans.map((p) => (
                        <MenuItem key={p.id} value={p.id}>
                          {p.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={newPlan}
                  disabled={savedPlans.length >= MAX_CUSTOM_PLANS_PER_PLAYER}
                >
                  New Plan
                </Button>

                {selectedPlanId && (
                  <>
                    <Tooltip title="Rename plan">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setRenameValue(planName);
                          setRenameMode(true);
                        }}
                      >
                        <DriveFileRenameOutline fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete plan">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setDeleteConfirmOpen(true)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </Stack>

              {/* Rename inline */}
              {renameMode && (
                <Stack direction="row" gap={1} mb={2} alignItems="center">
                  <TextField
                    size="small"
                    label="New name"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    inputProps={{ maxLength: MAX_CUSTOM_PLAN_NAME_LENGTH }}
                    sx={{ width: 240 }}
                  />
                  <Button
                    size="small"
                    onClick={doRename}
                    variant="contained"
                    disabled={!renameValue.trim()}
                  >
                    Rename
                  </Button>
                  <Button size="small" onClick={() => setRenameMode(false)}>
                    Cancel
                  </Button>
                </Stack>
              )}

              {/* Plan name field (for new/unsaved plans) */}
              {!selectedPlanId && (
                <TextField
                  size="small"
                  label="Plan name"
                  value={planName}
                  onChange={(e) => {
                    setPlanName(e.target.value);
                    setNameError(null);
                  }}
                  error={!!nameError}
                  helperText={nameError}
                  inputProps={{ maxLength: MAX_CUSTOM_PLAN_NAME_LENGTH }}
                  sx={{ mb: 2, width: 280 }}
                />
              )}

              <Divider sx={{ mb: 2 }} />

              <Stack direction="row" alignItems="center" gap={1} mb={2}>
                <TextField
                  size="small"
                  label="Multiplier"
                  value={multiplierText}
                  onChange={(e) => setMultiplierText(e.target.value)}
                  sx={{ width: 130 }}
                  inputProps={{ inputMode: "decimal" }}
                  error={!multiplierValid}
                  helperText={
                    !multiplierValid ? "Must be > 0" : "Scales row inputs"
                  }
                />
              </Stack>

              {/* Editor */}
              <CustomPlanEditor
                key={editorKey}
                initialItems={selectedPlan?.items}
                regions={visibleRegions}
                balances={balances}
                decBalance={decBalance}
                pools={pools}
                poolPositions={poolPositions}
                multiplier={multiplierValid ? multiplier : 1}
                onValidationChange={handleValidationChange}
                onDirtyChange={handleDirtyChange}
              />

              {/* Plan status */}
              {validationResult.status === "incomplete" && (
                <Alert severity="warning" sx={{ mt: 1.5 }}>
                  Some rows are incomplete. Complete or delete them to save or
                  execute.
                </Alert>
              )}
              {validationResult.status === "invalid" && (
                <Alert severity="error" sx={{ mt: 1.5 }}>
                  Some rows are invalid. Fix errors before executing. You may
                  still save the plan.
                </Alert>
              )}
              {!multiplierValid && (
                <Alert severity="warning" sx={{ mt: 1.5 }}>
                  Multiplier must be a positive number.
                </Alert>
              )}

              {/* Signature hint */}
              {canExecute &&
                validationResult.rows.filter((r) => r.resolvedAmount > 0)
                  .length > MAX_OPS_PER_BROADCAST && (
                  <Alert severity="info" sx={{ mt: 1.5 }}>
                    This plan will spread across multiple transactions.
                  </Alert>
                )}

              {/* Action errors */}
              {(saveError || action.error) && (
                <Alert severity="error" sx={{ mt: 1.5 }}>
                  {saveError ?? action.error}
                </Alert>
              )}
              {action.result && !action.result.success && (
                <Alert severity="error" sx={{ mt: 1.5 }}>
                  {action.result.error ?? "Broadcast failed"}
                </Alert>
              )}
              {action.result?.success && (
                <Alert severity="success" sx={{ mt: 1.5 }}>
                  Plan executed successfully.
                </Alert>
              )}
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 2, py: 1.5, gap: 1, flexWrap: "wrap" }}>
          <Button onClick={onClose} disabled={action.busy || saveBusy}>
            Close
          </Button>

          {canSave && isDirty && (
            <Button
              variant="outlined"
              startIcon={saveBusy ? <CircularProgress size={14} /> : <Save />}
              onClick={() => doSave()}
              disabled={saveBusy}
            >
              Save Only
            </Button>
          )}

          <Tooltip
            title={
              !effectiveCanExecute
                ? validationResult.status === "incomplete"
                  ? "Complete all rows first"
                  : validationResult.status === "invalid"
                    ? "Fix row errors first"
                    : validationResult.status === "empty"
                      ? "Add at least one row"
                      : !multiplierValid
                        ? "Set a positive multiplier"
                        : ""
                : ""
            }
          >
            <span>
              <Button
                variant="contained"
                color="secondary"
                onClick={tryExecute}
                disabled={!effectiveCanExecute}
                startIcon={
                  action.busy ? (
                    <CircularProgress size={14} color="inherit" />
                  ) : undefined
                }
              >
                {action.busy ? "Executing…" : "Execute"}
              </Button>
            </span>
          </Tooltip>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Delete plan?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Delete &ldquo;{selectedPlan?.name}&rdquo;? This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={doDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unsaved changes dialog */}
      <Dialog
        open={unsavedDialogOpen}
        onClose={() => setUnsavedDialogOpen(false)}
      >
        <DialogTitle>Unsaved changes</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This plan has unsaved changes. What would you like to do?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ gap: 0.5, flexWrap: "wrap" }}>
          <Button onClick={() => handleUnsavedChoice("cancel")}>Cancel</Button>
          {canSave && (
            <Button
              variant="outlined"
              onClick={() => handleUnsavedChoice("save_only")}
            >
              Save Only
            </Button>
          )}
          <Button
            variant="outlined"
            color="secondary"
            disabled={!effectiveCanExecute}
            onClick={() => handleUnsavedChoice("execute")}
          >
            Execute without saving
          </Button>
          {canSave && (
            <Button
              variant="contained"
              color="secondary"
              disabled={!effectiveCanExecute}
              onClick={() => handleUnsavedChoice("save_execute")}
            >
              Save &amp; Execute
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
