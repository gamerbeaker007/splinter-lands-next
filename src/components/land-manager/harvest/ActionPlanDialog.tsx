"use client";

import PlanLogBox from "@/components/land-manager/shared/PlanLogBox";
import { ActionPlan } from "@/types/landManager";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

interface Props {
  plan: ActionPlan;
  /** True while the confirmed plan is being broadcast. */
  busy: boolean;
  /** Broadcast the plan shown here. */
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * Shows what an action is about to do and waits for explicit confirmation.
 *
 * Every bulk action goes through this: the button builds the plan, this dialog
 * displays it, and nothing reaches the chain until Confirm is pressed. That
 * replaces the old separate "Dry Run" button — previewing is no longer a
 * different button the player has to remember to press first.
 */
export default function ActionPlanDialog({
  plan,
  busy,
  onConfirm,
  onClose,
}: Props) {
  return (
    <Dialog open onClose={busy ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>{plan.title}</DialogTitle>
      <DialogContent dividers>
        <Alert severity="info" sx={{ mb: 1.5 }}>
          <Typography variant="body2">
            Nothing has been broadcast yet. Review the plan below, then press{" "}
            <strong>Confirm &amp; Execute</strong> to run it.
          </Typography>
        </Alert>
        <PlanLogBox lines={plan.log} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={busy}
          startIcon={busy ? <CircularProgress size={14} /> : undefined}
        >
          {busy ? "Executing…" : "Confirm & Execute"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
