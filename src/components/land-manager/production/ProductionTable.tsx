"use client";

import { ProductionActionKind } from "@/hooks/useProductionPlotActions";
import {
  DeleteSweep as DeleteSweepIcon,
  PersonRemove as PersonRemoveIcon,
  PowerOff as PowerOffIcon,
  PowerSettingsNew as PowerOnIcon,
  Tune as TuneIcon,
} from "@mui/icons-material";
import {
  Chip,
  Collapse,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
} from "@mui/material";
import { Fragment, ReactNode } from "react";
import {
  ProductionRow,
  ProductionSortKey,
  SortDirection,
  worksiteLabel,
} from "./productionTypes";

function fmt(n: number, max = 2): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: max });
}

interface HeadCell {
  key: ProductionSortKey;
  label: string;
  numeric: boolean;
}

const HEAD_CELLS: HeadCell[] = [
  { key: "label", label: "Plot", numeric: false },
  { key: "regionNumber", label: "Region", numeric: false },
  { key: "worksiteType", label: "Worksite", numeric: false },
  { key: "rewardsPerHour", label: "Rewards/hr", numeric: true },
  { key: "netDEC", label: "Net DEC", numeric: true },
  { key: "basePP", label: "Base PP", numeric: true },
  { key: "boostedPP", label: "Boosted PP", numeric: true },
  { key: "powered", label: "Powered", numeric: false },
  { key: "workerCount", label: "Workers", numeric: true },
];

export interface ProductionTableProps {
  rows: ProductionRow[];
  sortKey: ProductionSortKey;
  sortDir: SortDirection;
  busy: boolean;
  /** deed_uids whose Configure panel is expanded. */
  expandedDeedUids: Set<string>;
  onSort: (key: ProductionSortKey) => void;
  onAction: (kind: ProductionActionKind, row: ProductionRow) => void;
  onToggleConfigure: (deedUid: string) => void;
  /** Render the Configure panel for an expanded row. */
  renderConfigure: (deedUid: string) => ReactNode;
}

const COLUMN_COUNT = 10; // 9 data columns + actions

function fmtPP(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export default function ProductionTable({
  rows,
  sortKey,
  sortDir,
  busy,
  expandedDeedUids,
  onSort,
  onAction,
  onToggleConfigure,
  renderConfigure,
}: ProductionTableProps) {
  return (
    <TableContainer>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            {HEAD_CELLS.map((cell) => (
              <TableCell
                key={cell.key}
                align={cell.numeric ? "right" : "left"}
                sortDirection={sortKey === cell.key ? sortDir : false}
              >
                <TableSortLabel
                  active={sortKey === cell.key}
                  direction={sortKey === cell.key ? sortDir : "asc"}
                  onClick={() => onSort(cell.key)}
                >
                  {cell.label}
                </TableSortLabel>
              </TableCell>
            ))}
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r) => (
            <Fragment key={r.deedUid}>
              <TableRow hover>
                <TableCell>{r.label}</TableCell>
                <TableCell>
                  <Typography variant="body2" noWrap>
                    {r.regionName || r.regionNumber}
                  </Typography>
                </TableCell>
                <TableCell>{worksiteLabel(r.worksiteType)}</TableCell>
                <TableCell align="right">
                  {r.rewardsPerHour > 0 ? (
                    <Typography variant="body2" noWrap>
                      {fmt(r.rewardsPerHour)}
                      {r.tokenSymbol ? ` ${r.tokenSymbol}` : ""}
                    </Typography>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell align="right">
                  <Typography
                    variant="body2"
                    color={
                      r.netDEC > 0
                        ? "success.main"
                        : r.netDEC < 0
                          ? "error.main"
                          : "text.secondary"
                    }
                    noWrap
                  >
                    {fmt(r.netDEC)}
                  </Typography>
                </TableCell>
                <TableCell align="right">{fmtPP(r.basePP)}</TableCell>
                <TableCell align="right">{fmtPP(r.boostedPP)}</TableCell>

                <TableCell align="left">
                  <Chip
                    size="small"
                    label={r.powered ? "Powered" : "Unpowered"}
                    color={r.powered ? "success" : "default"}
                    variant={r.powered ? "filled" : "outlined"}
                  />
                </TableCell>
                <TableCell align="right">
                  {r.workerCount}/{r.maxWorkers}
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={0.5} justifyContent="center">
                    <Tooltip
                      title={
                        r.listed
                          ? "Plot is listed on the market — cancel the listing to configure"
                          : r.powered
                            ? "Unpower"
                            : "Power on"
                      }
                    >
                      <span>
                        <IconButton
                          size="small"
                          color={r.powered ? "warning" : "success"}
                          disabled={busy || r.listed}
                          onClick={() =>
                            r.powered
                              ? onAction("unpower", r)
                              : onAction("powerOn", r)
                          }
                        >
                          {r.powered ? (
                            <PowerOffIcon fontSize="small" />
                          ) : (
                            <PowerOnIcon fontSize="small" />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip
                      title={
                        r.workerCount > 0 ? "Remove workers" : "No workers"
                      }
                    >
                      <span>
                        <IconButton
                          size="small"
                          color="warning"
                          disabled={busy || r.workerCount === 0}
                          onClick={() => onAction("removeWorkers", r)}
                        >
                          <PersonRemoveIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip
                      title={r.hasStakedItems ? "Empty plot" : "Already empty"}
                    >
                      <span>
                        <IconButton
                          size="small"
                          color="error"
                          disabled={busy || !r.hasStakedItems}
                          onClick={() => onAction("empty", r)}
                        >
                          <DeleteSweepIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip
                      title={
                        r.listed
                          ? "Plot is listed on the market — cancel the listing to configure"
                          : "Configure spots"
                      }
                    >
                      <span>
                        <IconButton
                          size="small"
                          color={
                            expandedDeedUids.has(r.deedUid)
                              ? "primary"
                              : "default"
                          }
                          disabled={r.listed}
                          onClick={() => onToggleConfigure(r.deedUid)}
                        >
                          <TuneIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell
                  colSpan={COLUMN_COUNT}
                  sx={{ py: 0, borderBottom: "none" }}
                >
                  <Collapse
                    in={expandedDeedUids.has(r.deedUid)}
                    timeout="auto"
                    unmountOnExit
                  >
                    {expandedDeedUids.has(r.deedUid) &&
                      renderConfigure(r.deedUid)}
                  </Collapse>
                </TableCell>
              </TableRow>
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
