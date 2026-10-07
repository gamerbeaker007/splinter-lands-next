"use client";

import {
  DeletePlanDialog,
  UnsavedChangesDialog,
  UnsavedChoice,
} from "@/components/land-manager/harvest/custom-plan/CustomPlanConfirmDialogs";
import CustomPlanSelector from "@/components/land-manager/harvest/custom-plan/CustomPlanSelector";
import CustomPlanStatusAlerts from "@/components/land-manager/harvest/custom-plan/CustomPlanStatusAlerts";
import CustomPlanSummary from "@/components/land-manager/harvest/custom-plan/CustomPlanSummary";
import CustomPlanEditor, {
  draftsToItems,
} from "@/components/land-manager/harvest/CustomPlanEditor";
import { useCustomPlanAction } from "@/hooks/useCustomPlanAction";
import { BroadcastResult } from "@/lib/frontend/splBroadcast";
import {
  deleteCustomPlan,
  getCustomPlans,
  renameCustomPlan,
  saveCustomPlan,
  setDefaultCustomPlan,
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
  CustomPlanRowValidation,
  CustomPlanValidationResult,
} from "@/types/landManager";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import { SplLandPool, SplPlayerPoolPosition } from "@/types/spl/landPools";
import { Save } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  username: string;
  visibleRegions: SplProductionOverviewRegion[];
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** Latest execution outcome, so the action card can show it after closing. */
  onStatusChange?: (status: CustomPlanExecutionStatus) => void;
}

export interface CustomPlanExecutionStatus {
  result: BroadcastResult | null;
  error: string | null;
}

export default function CustomPlanDialog({
  username,
  visibleRegions,
  open,
  onClose,
  onSuccess,
  onStatusChange,
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
  const [rowValidations, setRowValidations] = useState<
    CustomPlanRowValidation[]
  >([]);
  const [multiplierText, setMultiplierText] = useState("1");

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveBusy, setSaveBusy] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [unsavedDialogOpen, setUnsavedDialogOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ── Action hook ───────────────────────────────────────────────────────────────
  const action = useCustomPlanAction({ username, visibleRegions, onSuccess });

  // Report execution outcomes upward. The untouched initial state isn't
  // reported, so reopening the dialog keeps the card's last tx status.
  const hasReportedRef = useRef(false);
  useEffect(() => {
    if (!onStatusChange) return;
    if (!hasReportedRef.current && !action.result && !action.error) return;
    hasReportedRef.current = true;
    onStatusChange({ result: action.result, error: action.error });
  }, [action.result, action.error, onStatusChange]);

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
        // The player's default plan is what the dialog opens on; without one
        // it falls back to the first saved plan.
        const preselected = plans.find((p) => p.is_default) ?? plans[0];
        setSelectedPlanId(preselected.id);
        setPlanName(preselected.name);
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
    (
      result: CustomPlanValidationResult,
      rows: CustomPlanRowDraft[],
      configuredValidations: CustomPlanRowValidation[]
    ) => {
      setValidationResult(result);
      currentRowsRef.current = rows;
      setRowValidations(configuredValidations);
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
  async function doRename(trimmed: string): Promise<boolean> {
    if (!selectedPlanId) return false;
    const res = await renameCustomPlan(selectedPlanId, trimmed);
    if (res.error) {
      setSaveError(res.error);
      return false;
    }
    setSavedPlans((prev) =>
      prev.map((p) => (p.id === selectedPlanId ? { ...p, name: trimmed } : p))
    );
    setPlanName(trimmed);
    return true;
  }

  // ── Default plan ──────────────────────────────────────────────────────────────
  async function toggleDefault() {
    if (!selectedPlanId) return;
    const next = !(selectedPlan?.is_default ?? false);
    const res = await setDefaultCustomPlan(selectedPlanId, next);
    if (res.error) {
      setSaveError(res.error);
      return;
    }
    // Only one plan can be the default, so every other row is cleared locally
    // as well — matching what the transaction just did in the database.
    setSavedPlans((prev) =>
      prev.map((p) => ({
        ...p,
        is_default: p.id === selectedPlanId ? next : false,
      }))
    );
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

  async function handleUnsavedChoice(choice: UnsavedChoice) {
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

  const executeDisabledReason = !effectiveCanExecute
    ? validationResult.status === "incomplete"
      ? "Complete all rows first"
      : validationResult.status === "invalid"
        ? "Fix row errors first"
        : validationResult.status === "empty"
          ? "Add at least one row"
          : !multiplierValid
            ? "Set a positive multiplier"
            : ""
    : "";

  return (
    <>
      <Dialog
        open={open}
        onClose={action.busy ? undefined : onClose}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ px: 2, py: 1 }}>Custom Plan</DialogTitle>

        <DialogContent
          dividers
          sx={{
            p: 2,
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          {loading && (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          )}

          {!loading && (
            <>
              {loadError && <Alert severity="error">{loadError}</Alert>}

              <CustomPlanSummary
                planControl={
                  <CustomPlanSelector
                    savedPlans={savedPlans}
                    selectedPlan={selectedPlan}
                    planName={planName}
                    nameError={nameError}
                    onPlanNameChange={(name) => {
                      setPlanName(name);
                      setNameError(null);
                    }}
                    onSelect={selectPlan}
                    onNew={newPlan}
                    onToggleDefault={toggleDefault}
                    onRename={doRename}
                    onDelete={() => setDeleteConfirmOpen(true)}
                  />
                }
                isDirty={isDirty}
                rowValidations={rowValidations}
                multiplierText={multiplierText}
                multiplierValid={multiplierValid}
                onMultiplierChange={setMultiplierText}
                canExecute={effectiveCanExecute}
                executeDisabledReason={executeDisabledReason}
                executing={action.busy}
                onExecute={tryExecute}
              />

              <CustomPlanStatusAlerts
                status={validationResult.status}
                multiplierValid={multiplierValid}
                error={saveError ?? action.error}
                result={action.result}
              />

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
        </DialogActions>
      </Dialog>

      <DeletePlanDialog
        open={deleteConfirmOpen}
        planName={selectedPlan?.name}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={doDelete}
      />

      <UnsavedChangesDialog
        open={unsavedDialogOpen}
        canSave={canSave}
        canExecute={effectiveCanExecute}
        onChoice={handleUnsavedChoice}
      />
    </>
  );
}
