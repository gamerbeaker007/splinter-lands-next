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
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Box,
} from "@mui/material";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

type Props = {
  open: boolean;
  onClose: () => void;
  onImported: (deed: DeedComplete) => void;
};

const HELP_IMG_URL =
  "https://files.peakd.com/file/peakd-hive/beaker007/23xoayKbz2jCnwM3HoR84H76qUPYq4rddzzrmifx5AjQKRwK3gwFr7RWvtALjPYqtauJa.png";

const PlotIdHelpAdornment = (
  <InputAdornment position="end">
    <Tooltip
      arrow
      placement="top-start"
      slotProps={{
        tooltip: {
          sx: {
            maxWidth: "none",
          },
        },
      }}
      title={
        <Box sx={{ p: 0.5 }}>
          <Box sx={{ position: "relative", width: 620, height: 260 }}>
            <Image
              src={HELP_IMG_URL}
              alt="Where to find your Plot ID"
              fill
              sizes="420px"
              style={{ objectFit: "contain", display: "block" }}
            />
          </Box>
        </Box>
      }
    >
      <IconButton edge="end" aria-label="Plot ID help" tabIndex={-1}>
        <InfoOutlinedIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  </InputAdornment>
);

export function ImportDeedDialog({ open, onClose, onImported }: Props) {
  const [plotId, setPlotId] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const { loading, error: fetchError, fetchPlot, reset } = useFetchPlot();

  useEffect(() => {
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
            fullWidth
            type="number"
            inputMode="numeric"
            value={plotId}
            onChange={(e) => setPlotId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleImport()}
            autoFocus
            disabled={loading}
            slotProps={{
              input: {
                endAdornment: PlotIdHelpAdornment,
                sx: {
                  // Hide number input spinners
                  "& input[type=number]": {
                    MozAppearance: "textfield",
                  },
                  "& input[type=number]::-webkit-outer-spin-button": {
                    WebkitAppearance: "none",
                    margin: 0,
                  },
                  "& input[type=number]::-webkit-inner-spin-button": {
                    WebkitAppearance: "none",
                    margin: 0,
                  },
                },
              },
            }}
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
