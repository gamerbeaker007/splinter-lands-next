"use client";

import { ProductionActionKind } from "@/hooks/useProductionPlotActions";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import { ProductionRow } from "./productionTypes";

export const ACTION_META: Record<
  ProductionActionKind,
  { title: string; verb: string; destructive: boolean; warning?: string }
> = {
  powerOn: {
    title: "Power on",
    verb: "Stake a Power Core on",
    destructive: false,
  },
  unpower: {
    title: "Unpower",
    verb: "Remove the Power Core from",
    destructive: true,
    warning:
      "Removing the Power Core unpowers the plot — its workers stop producing until it is powered again.",
  },
  removeWorkers: {
    title: "Remove workers",
    verb: "Unstake all worker cards from",
    destructive: true,
    warning:
      "Unstaking workers triggers an auto-harvest of any pending production on the plot.",
  },
  empty: {
    title: "Empty plot",
    verb: "Unstake all workers, the Power Core, the title and the totem from",
    destructive: true,
    warning:
      "Emptying a plot unstakes everything (workers, Power Core, title, totem) and triggers an auto-harvest of pending production.",
  },
};

interface Props {
  open: boolean;
  kind: ProductionActionKind;
  rows: ProductionRow[];
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmActionDialog({
  open,
  kind,
  rows,
  busy,
  onClose,
  onConfirm,
}: Props) {
  const meta = ACTION_META[kind];
  const count = rows.length;

  return (
    <Dialog
      open={open}
      onClose={busy ? undefined : onClose}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>
        {meta.title} · {count} plot{count !== 1 ? "s" : ""}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 1 }}>
          {meta.verb} {count === 1 ? "this plot" : `these ${count} plots`}?
        </Typography>

        {meta.warning && (
          <Alert
            severity={meta.destructive ? "warning" : "info"}
            sx={{ mb: 1 }}
          >
            {meta.warning}
          </Alert>
        )}

        <Box
          sx={{
            maxHeight: 220,
            overflow: "auto",
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
          }}
        >
          <List dense disablePadding>
            {rows.map((r) => (
              <ListItem key={r.deedUid} divider>
                <ListItemText
                  primary={r.label}
                  secondary={
                    r.regionName
                      ? `${r.regionName} · ${r.workerCount}/${r.maxWorkers} workers`
                      : `${r.workerCount}/${r.maxWorkers} workers`
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>

        {count > 5 && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1, display: "block" }}
          >
            These are broadcast in batches of 5 — Keychain will prompt once per
            batch.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color={meta.destructive ? "error" : "primary"}
          onClick={onConfirm}
          disabled={busy}
        >
          {busy ? "Working…" : meta.title}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
