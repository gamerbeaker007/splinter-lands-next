"use client";

import PlanLogBox from "@/components/land-manager/shared/PlanLogBox";
import { useCoverGrainAction } from "@/hooks/useCoverGrainAction";
import { formatInt } from "@/lib/formatters";
import { CoverGrainTarget } from "@/lib/frontend/coverWorksiteGrainOps";
import { actionButtonLabel, actionPhaseLabel } from "@/lib/shared/actionPhase";
import { MakeHarvestableStrategy } from "@/types/landManager";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useEffect, useMemo } from "react";

interface Props {
  open: boolean;
  username: string;
  strategies: MakeHarvestableStrategy[];
  /**
   * Regions to top up and how much grain each must end up holding. One entry for
   * the single-plot flow, one per affected region for the bulk flow.
   */
  targets: CoverGrainTarget[];
  /** Shown after the dialog title — e.g. a plot label or "12 plots". */
  subject: string;
  /** Plot labels covered by this plan — listed so bulk runs stay understandable. */
  plotLabels?: string[];
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Plan-then-confirm dialog for the "Fix grain deficit" flow.
 *
 * The plan is computed on open and nothing is broadcast until the user presses
 * Fix deficit — the same contract for a single plot and for a bulk selection.
 */
export default function FixGrainDeficitDialog({
  open,
  username,
  strategies,
  targets,
  subject,
  plotLabels,
  onClose,
  onSuccess,
}: Props) {
  const { status, phase, plan, error, buildPlanForRegions, confirm, reset } =
    useCoverGrainAction({ username, strategies });

  // Stable identity so the planning effect doesn't re-run on every render of the
  // parent (targets is typically rebuilt inline from the current selection).
  const targetKey = useMemo(
    () =>
      targets
        .map((t) => `${t.regionUid}:${t.grainNeeded}`)
        .sort()
        .join("|"),
    [targets]
  );

  // Compute the proposal when the dialog opens; reset when it closes.
  useEffect(() => {
    if (open) {
      buildPlanForRegions(targets);
    } else {
      reset();
    }
    // buildPlanForRegions/reset are stable (useCallback); targetKey drives recompute.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, targetKey, buildPlanForRegions, reset]);

  // Notify parent once the grain has been moved (so it refreshes balances and
  // enables the Feed workers button).
  useEffect(() => {
    if (status === "done") onSuccess();
  }, [status, onSuccess]);

  const busy = status === "planning" || status === "covering";
  const multiRegion = (plan?.regions.length ?? 0) > 1;

  const handleClose = () => {
    if (busy) return; // don't allow closing mid-broadcast
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Fix grain deficit — {subject}</DialogTitle>
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
              <strong>{formatInt(plan.grainNeeded)} GRAIN</strong>
              {multiRegion
                ? ` across ${plan.regions.length} regions`
                : " in this region"}
              . Currently held: <strong>{formatInt(plan.currentGrain)}</strong>{" "}
              — short{" "}
              <strong>
                {formatInt(Math.max(0, plan.grainNeeded - plan.currentGrain))}
              </strong>
              .
            </Typography>

            {plotLabels && plotLabels.length > 0 && (
              <Stack
                direction="row"
                gap={0.5}
                flexWrap="wrap"
                sx={{ mb: 1.5, mt: 0.5 }}
              >
                {plotLabels.map((label) => (
                  <Chip
                    key={label}
                    label={label}
                    size="small"
                    variant="outlined"
                    sx={{ height: 18, fontSize: "0.62rem" }}
                  />
                ))}
              </Stack>
            )}

            {plan.resolved ? (
              <Alert severity="success" sx={{ mb: 1.5 }}>
                The plan below brings in {formatInt(plan.delivered)} GRAIN (pool
                → transfer → swap → buy with DEC), enough to cover the
                requirement. This only moves grain — once it lands, use Feed
                workers to activate the worksite
                {multiRegion ? "s" : ""}.
              </Alert>
            ) : (
              <Alert severity="warning" sx={{ mb: 1.5 }}>
                Could not fully cover the requirement — the plan only brings in{" "}
                {formatInt(plan.delivered)} GRAIN, still short{" "}
                {formatInt(plan.shortfall)}. Free up surplus grain in another
                region, add DEC, or top up manually.
              </Alert>
            )}

            {multiRegion && (
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Per region
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Region</TableCell>
                      <TableCell align="right">Needed</TableCell>
                      <TableCell align="right">Held</TableCell>
                      <TableCell align="right">Delivered</TableCell>
                      <TableCell align="right">Short</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {plan.regions.map((r) => (
                      <TableRow key={r.regionUid}>
                        <TableCell>{r.regionName}</TableCell>
                        <TableCell align="right">
                          {formatInt(r.grainNeeded)}
                        </TableCell>
                        <TableCell align="right">
                          {formatInt(r.currentGrain)}
                        </TableCell>
                        <TableCell align="right">
                          {formatInt(r.delivered)}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            color: r.resolved ? "success.main" : "warning.main",
                          }}
                        >
                          {formatInt(r.shortfall)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
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
                  {phase === "confirming"
                    ? (actionPhaseLabel(phase) ??
                      "Transferring / swapping / buying grain…")
                    : "Transferring / swapping / buying grain…"}
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
                the worksite{multiRegion ? "s" : ""}.
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
          startIcon={
            busy ? <CircularProgress size={14} color="inherit" /> : undefined
          }
        >
          {status === "covering"
            ? (actionButtonLabel(phase) ?? "Fix deficit")
            : status === "planning"
              ? "Planning…"
              : "Fix deficit"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
