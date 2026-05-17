"use client";

import { DryRunResult } from "@/types/landManager";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Typography,
} from "@mui/material";

interface Props {
  result: DryRunResult;
  onClose: () => void;
}

export default function DryRunDialog({ result, onClose }: Props) {
  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{result.title}</DialogTitle>
      <DialogContent dividers>
        <Typography variant="subtitle2" gutterBottom>
          Plan
        </Typography>
        <Paper
          variant="outlined"
          sx={{
            p: 1.5,
            fontFamily: "monospace",
            fontSize: "0.75rem",
            whiteSpace: "pre-wrap",
            bgcolor: "action.hover",
            maxHeight: 400,
            overflow: "auto",
          }}
        >
          {result.log.join("\n") || "(nothing to do)"}
        </Paper>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
