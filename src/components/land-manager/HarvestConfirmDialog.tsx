"use client";

import { DAILY_FEE_CAPS, SERVICE_FEE_PCT } from "@/types/landManager";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
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

export default function HarvestConfirmDialog({
  open,
  visibleRegions,
  feeApplicableRegionNumbers,
  onConfirm,
  onCancel,
}: Props) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const exemptRegions = visibleRegions.filter(
    (r) => !feeApplicableRegionNumbers.has(r.region_number)
  );
  const feeRegions = visibleRegions.filter((r) =>
    feeApplicableRegionNumbers.has(r.region_number)
  );

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>Confirm Harvest</DialogTitle>
      <DialogContent dividers>
        <Typography gutterBottom>
          A <strong>{SERVICE_FEE_PCT}%</strong> service fee is charged on all
          harvested resources.
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

        <Divider sx={{ my: 1.5 }} />

        <Typography variant="subtitle2" gutterBottom>
          Daily fee caps (account-wide, cumulative across regions)
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Resource</TableCell>
              <TableCell align="right">Daily max fee</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(DAILY_FEE_CAPS).map(([symbol, cap]) => (
              <TableRow key={symbol}>
                <TableCell>{symbol}</TableCell>
                <TableCell align="right">{cap.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
          color="success"
          onClick={() => onConfirm(dontShowAgain)}
        >
          Harvest
        </Button>
      </DialogActions>
    </Dialog>
  );
}
