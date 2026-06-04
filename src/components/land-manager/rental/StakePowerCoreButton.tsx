"use client";

import { useStakePowerCoreAction } from "@/hooks/useStakePowerCoreAction";
import { RentalEligiblePlot } from "@/types/landManager";
import { Bolt } from "@mui/icons-material";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState } from "react";

interface Props {
  username: string;
  plot: RentalEligiblePlot;
  onSuccess: () => void;
}

export default function StakePowerCoreButton({
  username,
  plot,
  onSuccess,
}: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const isListedForSale = Boolean(plot.listed);

  const action = useStakePowerCoreAction({
    username,
    plot,
    onSuccess: () => {
      setDialogOpen(false);
      onSuccess();
    },
  });

  const handleOpen = async () => {
    setDialogOpen(true);
    await action.loadInfo();
  };

  const handleConfirm = async () => {
    if (!action.powerCoreInfo || action.powerCoreInfo.ids.length === 0) return;
    await action.execute(action.powerCoreInfo.ids[0]);
  };

  const handleClose = () => {
    if (action.busy) return;
    setDialogOpen(false);
    action.clearError();
  };

  return (
    <>
      <Tooltip
        title={
          isListedForSale
            ? "Cannot stake Power Core while plot is listed for sale"
            : "Stake a Power Core to boost resource production by 50%"
        }
      >
        <span>
          <Button
            size="small"
            variant="outlined"
            color="warning"
            startIcon={<Bolt fontSize="small" />}
            disabled={isListedForSale}
            onClick={handleOpen}
          >
            Stake Power Core
          </Button>
        </span>
      </Tooltip>

      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle>Stake Power Core</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            {action.error && (
              <Alert severity="error" onClose={action.clearError}>
                {action.error}
              </Alert>
            )}

            {action.powerCoreInfo && action.powerCoreInfo.count === 0 && (
              <Alert severity="warning">No Power Cores available.</Alert>
            )}

            <Typography variant="body2">
              Stake a Power Core on plot{" "}
              <strong>
                R{plot.region_number} · T{plot.tract_number} · P
                {plot.plot_number}
              </strong>
              .
            </Typography>

            {action.busy && !action.powerCoreInfo && (
              <Stack direction="row" alignItems="center" gap={1}>
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">
                  Fetching Power Cores…
                </Typography>
              </Stack>
            )}

            {action.powerCoreInfo && (
              <>
                <Typography variant="body2">
                  Available Power Cores:{" "}
                  <strong>{action.powerCoreInfo.count.toLocaleString()}</strong>
                </Typography>

                {action.powerCoreInfo.ids.length > 0 && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontFamily: "monospace" }}
                  >
                    Will stake: {action.powerCoreInfo.ids[0]}
                  </Typography>
                )}
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={action.busy}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleConfirm}
            disabled={
              action.busy ||
              !action.powerCoreInfo ||
              action.powerCoreInfo.count === 0 ||
              action.powerCoreInfo.ids.length === 0
            }
            startIcon={
              action.busy ? (
                <CircularProgress size={14} color="inherit" />
              ) : undefined
            }
          >
            Stake
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
