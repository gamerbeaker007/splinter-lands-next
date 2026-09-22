"use client";

import ActionPlanSummary from "@/components/land-manager/shared/ActionPlanSummary";
import PlanLogBox from "@/components/land-manager/shared/PlanLogBox";
import { ActionPlan } from "@/types/landManager";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { useState } from "react";

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
 *
 * What the plan comes down to is shown first, summed per strategy with icons;
 * the step-by-step log that produced those numbers sits behind Details, for
 * when a total looks wrong and the reason matters.
 */
export default function ActionPlanDialog({
  plan,
  busy,
  onConfirm,
  onClose,
}: Props) {
  const [showDetails, setShowDetails] = useState(false);
  const rows = plan.rows ?? [];

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
        {rows.length > 0 && (
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="body2" gutterBottom fontSize="20">
              Expected result
            </Typography>
            <ActionPlanSummary rows={rows} />
          </Box>
        )}

        {/* No summary means the planner produced nothing to sum, so the log is
            the only thing worth showing — and it says why. */}
        {rows.length === 0 ? (
          <PlanLogBox lines={plan.log} />
        ) : (
          <>
            <Button
              size="small"
              onClick={() => setShowDetails((v) => !v)}
              startIcon={
                <ExpandMoreIcon
                  sx={{
                    transform: showDetails ? "rotate(180deg)" : "none",
                    transition: "transform 0.15s ease",
                  }}
                />
              }
            >
              Details
            </Button>
            <Collapse in={showDetails} unmountOnExit>
              <Box sx={{ mt: 1 }}>
                <PlanLogBox lines={plan.log} />
              </Box>
            </Collapse>
          </>
        )}
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
