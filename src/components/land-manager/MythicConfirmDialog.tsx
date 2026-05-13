"use client";

import { SERVICE_FEE_PCT } from "@/types/landManager";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import { useState } from "react";

interface Props {
  open: boolean;
  visibleRegions: SplProductionOverviewRegion[];
  feeApplicableRegionNumbers: Set<number>;
  onConfirm: (ack: boolean) => void;
  onCancel: () => void;
}

export default function MythicConfirmDialog({
  open,
  visibleRegions,
  feeApplicableRegionNumbers,
  onConfirm,
  onCancel,
}: Props) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const feeRegions = visibleRegions.filter((r) =>
    feeApplicableRegionNumbers.has(r.region_number)
  );
  const exemptRegions = visibleRegions.filter(
    (r) => !feeApplicableRegionNumbers.has(r.region_number)
  );

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>Confirm Mythic Harvest</DialogTitle>
      <DialogContent dividers>
        <Typography gutterBottom>
          This will harvest resources from your <strong>Keeps</strong> and{" "}
          <strong>Castles</strong>.
        </Typography>
        <Typography gutterBottom>
          A <strong>{SERVICE_FEE_PCT}%</strong> service fee is charged on all
          harvested resources, paid immediately after the harvest.
        </Typography>

        {feeRegions.length > 0 && (
          <>
            <Typography variant="subtitle2" mt={1}>
              Fee applies:
            </Typography>
            <List dense disablePadding sx={{ listStyleType: "disc", pl: 2 }}>
              {feeRegions.map((r) => (
                <ListItem
                  key={r.region_uid}
                  disableGutters
                  sx={{ py: 0, display: "list-item" }}
                >
                  <ListItemText primary={r.name} />
                </ListItem>
              ))}
            </List>
          </>
        )}

        {exemptRegions.length > 0 && (
          <>
            <Typography variant="subtitle2" mt={1}>
              Fee exempt:
            </Typography>
            <List dense disablePadding sx={{ listStyleType: "disc", pl: 2 }}>
              {exemptRegions.map((r) => (
                <ListItem
                  key={r.region_uid}
                  disableGutters
                  sx={{ py: 0, display: "list-item" }}
                >
                  <ListItemText primary={r.name} />
                </ListItem>
              ))}
            </List>
          </>
        )}
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
