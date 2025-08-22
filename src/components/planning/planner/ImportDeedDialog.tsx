"use client";
import { useFetchPlot } from "@/hooks/useFetchPlot";
import type { DeedComplete } from "@/types/deed";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import * as React from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onImported: (deed: DeedComplete) => void;
};

export function ImportDeedDialog({ open, onClose, onImported }: Props) {
  const [plotId, setPlotId] = React.useState("");
  const [localError, setLocalError] = React.useState<string | null>(null);
  const { loading, error: fetchError, fetchPlot, reset } = useFetchPlot();

  React.useEffect(() => {
    if (!open) {
      setPlotId("");
      setLocalError(null);
      reset();
    }
  }, [open, reset]);

  const handleImport = async () => {
    setLocalError(null);
    const id = Number(plotId);
    if (!Number.isFinite(id) || id <= 0) {
      setLocalError("Please enter a valid numeric Plot ID.");
      return;
    }
    const deed = await fetchPlot(id);
    if (deed) {
      // only proceed on success
      onImported(deed);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Import Plot</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Plot ID"
            value={plotId}
            onChange={(e) => setPlotId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleImport()}
            autoFocus
            disabled={loading}
            inputMode="numeric"
          />
          {loading && <CircularProgress size={24} />}
          {(localError || fetchError) && (
            <Alert severity="error">{localError || fetchError}</Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleImport}
          disabled={loading || !plotId}
        >
          Import
        </Button>
      </DialogActions>
    </Dialog>
  );
}
