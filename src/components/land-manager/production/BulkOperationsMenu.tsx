"use client";

import { ACTION_META } from "@/components/land-manager/production/ConfirmActionDialog";
import RenewRentalsActionControl from "@/components/land-manager/production/rental-actions/RenewRentalsActionControl";
import { ProductionRow } from "@/components/land-manager/production/productionTypes";
import { ProductionActionKind } from "@/hooks/useProductionPlotActions";
import { ExpandMore as ExpandMoreIcon } from "@mui/icons-material";
import {
  Box,
  Button,
  Divider,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import type { ReactNode } from "react";
import { type MouseEvent, useState } from "react";

interface Props {
  username: string;
  filteredRows: ProductionRow[];
  loading: boolean;
  busy: boolean;
  onSuccess: () => void;
  onOpenBulkConfirm: (
    kind: ProductionActionKind,
    rows: ProductionRow[]
  ) => void;
  actionableRows: (
    kind: ProductionActionKind,
    rows: ProductionRow[]
  ) => ProductionRow[];
  renderWorksiteActions: (closeMenu: () => void) => ReactNode;
  renderDecActions: (closeMenu: () => void) => ReactNode;
}

export default function BulkOperationsMenu({
  username,
  filteredRows,
  loading,
  busy,
  onSuccess,
  onOpenBulkConfirm,
  actionableRows,
  renderWorksiteActions,
  renderDecActions,
}: Props) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const open = Boolean(anchor);

  const openMenu = (event: MouseEvent<HTMLElement>) =>
    setAnchor(event.currentTarget);
  const closeMenu = () => setAnchor(null);

  return (
    <>
      <Button
        fullWidth
        sx={{ minWidth: 0, whiteSpace: "nowrap" }}
        variant="outlined"
        endIcon={<ExpandMoreIcon />}
        onClick={openMenu}
        aria-haspopup="menu"
        aria-expanded={open ? "true" : undefined}
      >
        Bulk operations
      </Button>
      <Menu
        anchorEl={anchor}
        open={open}
        onClose={closeMenu}
        slotProps={{ root: { keepMounted: true } }}
      >
        <Box sx={{ px: 2, py: 0.75 }}>
          <Typography variant="caption" color="text.secondary">
            Actions for {filteredRows.length} filtered plot
            {filteredRows.length === 1 ? "" : "s"}
          </Typography>
        </Box>
        {(
          [
            "powerOn",
            "unpower",
            "removeWorkers",
            "empty",
          ] as ProductionActionKind[]
        ).map((kind) => {
          const targets = actionableRows(kind, filteredRows);
          const meta = ACTION_META[kind];
          return (
            <MenuItem
              key={kind}
              disabled={loading || busy || targets.length === 0}
              onClick={() => {
                closeMenu();
                onOpenBulkConfirm(kind, targets);
              }}
              sx={{ color: meta.destructive ? "error.main" : undefined }}
            >
              {meta.title} ({targets.length})
            </MenuItem>
          );
        })}
        <Divider />
        {renderWorksiteActions(closeMenu)}
        <Divider />
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", px: 2, pt: 0.5 }}
        >
          DEC
        </Typography>
        {renderDecActions(closeMenu)}
        <Divider />
        <Stack sx={{ px: 2, py: 1 }} gap={0.75}>
          <Typography variant="caption" color="text.secondary">
            Rentals
          </Typography>
          <RenewRentalsActionControl
            username={username}
            onSuccess={onSuccess}
          />
        </Stack>
      </Menu>
    </>
  );
}
