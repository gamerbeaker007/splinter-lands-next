"use client";

import PlanLogBox from "@/components/land-manager/PlanLogBox";
import { DryRunResult } from "@/types/landManager";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
        <PlanLogBox lines={result.log} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
