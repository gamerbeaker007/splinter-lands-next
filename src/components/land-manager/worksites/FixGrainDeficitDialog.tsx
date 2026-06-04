"use client";

import PlanLogBox from "@/components/land-manager/shared/PlanLogBox";
import { useCoverGrainAction } from "@/hooks/useCoverGrainAction";
import { DeedComplete } from "@/types/deed";
import { MakeHarvestableStrategy } from "@/types/landManager";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect } from "react";

interface Props {
  open: boolean;
  deed: DeedComplete;
  username: string;
  strategies: MakeHarvestableStrategy[];
  plotLabel: string;
  onClose: () => void;
  onSuccess: () => void;
}

const fmt = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: 0 });

export default function FixGrainDeficitDialog({
  open,
  deed,
  username,
  strategies,
  plotLabel,
  onClose,
  onSuccess,
}: Props) {
  const { status, plan, error, buildPlan, confirm, reset } =
    useCoverGrainAction({ username, strategies });

  // Compute the proposal when the dialog opens; reset when it closes.
  useEffect(() => {
    if (open) {
      buildPlan(deed);
    } else {
      reset();
    }
    // buildPlan/reset are stable (useCallback); deed identity drives recompute.
  }, [open, deed, buildPlan, reset]);

  // Notify parent once the grain has been moved (so it refreshes balances and
  // enables the Feed workers button).
  useEffect(() => {
    if (status === "done") onSuccess();
  }, [status, onSuccess]);

  const busy = status === "planning" || status === "covering";

  const handleClose = () => {
    if (busy) return; // don't allow closing mid-broadcast
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Fix grain deficit — {plotLabel}</DialogTitle>
      <DialogContent dividers>
        {status === "planning" && (
          <Stack direction="row" alignItems="center" gap={1.5} sx={{ py: 2 }}>
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              Computing proposal from your other regions…
            </Typography>
          </Stack>
        )}

        {status === "error" && !plan && (
          <Alert severity="error">{error ?? "Could not build a plan."}</Alert>
        )}

        {plan && (
          <>
            <Typography variant="body2" gutterBottom>
              Feeding the workers needs{" "}
              <strong>{fmt(plan.grainNeeded)} GRAIN</strong>. This region holds{" "}
              <strong>{fmt(plan.currentGrain)}</strong> — short{" "}
              <strong>{fmt(plan.grainNeeded - plan.currentGrain)}</strong>.
            </Typography>

            {plan.resolved ? (
              <Alert severity="success" sx={{ mb: 1.5 }}>
                The plan below brings in {fmt(plan.delivered)} GRAIN (transfer →
                swap → buy with DEC), enough to cover the requirement. This only
                moves grain — once it lands, use the Feed workers button to
                activate the worksite.
              </Alert>
            ) : (
              <Alert severity="warning" sx={{ mb: 1.5 }}>
                Could not fully cover the requirement — the plan only brings in{" "}
                {fmt(plan.delivered)} GRAIN, still short {fmt(plan.shortfall)}.
                Free up surplus grain in another region, add DEC, or top up
                manually.
              </Alert>
            )}

            <Typography variant="subtitle2" gutterBottom>
              Proposed operations
            </Typography>
            <PlanLogBox
              lines={plan.log}
              emptyText="(no resource moves needed)"
              maxHeight={320}
            />

            {status === "covering" && (
              <Stack
                direction="row"
                alignItems="center"
                gap={1.5}
                sx={{ mt: 1.5 }}
              >
                <CircularProgress size={18} />
                <Typography variant="body2" color="text.secondary">
                  Transferring / swapping / buying grain…
                </Typography>
              </Stack>
            )}

            {status === "error" && error && (
              <Alert severity="error" sx={{ mt: 1.5 }}>
                {error}
              </Alert>
            )}

            {status === "done" && (
              <Alert severity="success" sx={{ mt: 1.5 }}>
                Grain deficit fixed! Reload, then use Feed workers to activate
                the worksite.
              </Alert>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={busy} size="small">
          {status === "done" ? "Close" : "Cancel"}
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          onClick={() => confirm()}
          size="small"
          variant="contained"
          color="warning"
          disabled={!plan || !plan.resolved || busy || status === "done"}
          startIcon={busy ? <CircularProgress size={14} /> : undefined}
        >
          Fix deficit
        </Button>
      </DialogActions>
    </Dialog>
  );
}
