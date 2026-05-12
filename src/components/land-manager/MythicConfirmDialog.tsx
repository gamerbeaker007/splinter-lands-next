"use client";

import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Typography,
} from "@mui/material";
import { useState } from "react";

interface Props {
  open: boolean;
  onConfirm: (ack: boolean) => void;
  onCancel: () => void;
}

export default function MythicConfirmDialog({
  open,
  onConfirm,
  onCancel,
}: Props) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>Confirm Mythic Harvest</DialogTitle>
      <DialogContent dividers>
        <Typography gutterBottom>
          This will harvest resources from your <strong>Keeps</strong> and{" "}
          <strong>Castles</strong> using the <em>tax_collection</em> operation.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No service fee is charged for mythic (keep/castle) harvests.
        </Typography>
      </DialogContent>
      <DialogActions>
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
            />
          }
          label={
            <Typography variant="body2">{"Don't show this again"}</Typography>
          }
        />
        <Button onClick={onCancel}>Cancel</Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => onConfirm(dontShowAgain)}
        >
          Harvest
        </Button>
      </DialogActions>
    </Dialog>
  );
}
