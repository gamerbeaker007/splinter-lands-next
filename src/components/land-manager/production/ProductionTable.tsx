"use client";

import { Resource } from "@/constants/resource/resource";
import { ProductionActionKind } from "@/hooks/useProductionPlotActions";
import { getElementIconUrl } from "@/lib/frontend/utils/icons";
import { RESOURCE_COLOR_MAP, RESOURCE_ICON_MAP } from "@/lib/shared/statics";
import {
  land_default_off_icon_url_placeholder,
  land_hammer_icon_url,
  land_mythic_icon_url,
  WEB_URL,
} from "@/lib/shared/statics_icon_urls";
import { TAX_ESTIMATE_NOTE } from "@/lib/shared/taxProduction";
import { BiomeModifiers } from "@/lib/utils/cardUtil";
import {
  DeleteSweep as DeleteSweepIcon,
  PersonRemove as PersonRemoveIcon,
  PowerOff as PowerOffIcon,
  PowerSettingsNew as PowerOnIcon,
  Tune as TuneIcon,
  WarningAmber as WarningAmberIcon,
} from "@mui/icons-material";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import {
  Avatar,
  capitalize,
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
import Image from "next/image";
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
  key?: ProductionSortKey;
  label: string;
  numeric: boolean;
  tootTip?: string;
  width?: number;
  iconCell?: boolean;
}

const ICON_COLUMN_WIDTH = 50;

const iconCellSx = {
  width: ICON_COLUMN_WIDTH,
  minWidth: ICON_COLUMN_WIDTH,
  maxWidth: ICON_COLUMN_WIDTH,
  px: 0.5,
};

const HEAD_CELLS: HeadCell[] = [
  { key: "label", label: "Plot", numeric: false },
  {
    key: "rarity",
    label: "R",
    tootTip: "Rarity",
    numeric: false,
    iconCell: true,
  },
  {
    key: "plotStatus",
    label: "S",
    tootTip: "Plot Status",
    numeric: false,
    iconCell: true,
  },
  { key: "regionNumber", label: "Region", numeric: false },
  { key: "worksiteType", label: "Worksite", numeric: false },
  { key: "rewardsPerHour", label: "Rewards/hr", numeric: true },
  { key: "netDEC", label: "Net DEC/hr", numeric: true },
  { key: "basePP", label: "Base PP", numeric: true },
  { key: "boostedPP", label: "Boosted PP", numeric: true },
  { key: "powered", label: "P", tootTip: "Powered", numeric: false },
  { label: "B", tootTip: "Positive Terrain Boosts", numeric: false }, // Not Sortable
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

const COLUMN_COUNT = 11; // 10 data columns + actions

function fmtPP(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function rarityIcon(rarity: string): string {
  return rarity === "mythic"
    ? land_mythic_icon_url
    : land_default_off_icon_url_placeholder.replace("__NAME__", rarity);
}

function plotStatusIcon(plotStatus: string): string {
  const landPlotIconUrl = `${WEB_URL}website/ui_elements/lands/sideMenu/__NAME__Off.svg`;
  return landPlotIconUrl.replace("__NAME__", plotStatus.toLowerCase());
}

function showPositiveTerrainBoosts(biomeModifiers: BiomeModifiers) {
  return (
    <Stack direction="row" spacing={1}>
      {Object.entries(biomeModifiers)
        .filter(([, modifier]) => modifier > 0)
        .map(([biome, modifier]) => {
          return (
            <Tooltip
              key={biome}
              title={`${biome}: +${modifier * 100}%`}
              placement={"top"}
              followCursor={true}
            >
              <Avatar
                src={getElementIconUrl(biome)}
                sx={{
                  height: 20,
                  width: 20,
                }}
              />
            </Tooltip>
          );
        })}
    </Stack>
  );
}

function getResourceIcon(resource: Resource) {
  const img = RESOURCE_ICON_MAP[resource] ?? land_hammer_icon_url;
  return (
    <Image
      src={img}
      alt={capitalize(resource.toLowerCase())}
      width={16}
      height={16}
    />
  );
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
            {HEAD_CELLS.map((cell, index) => (
              <Tooltip
                title={cell.tootTip ?? ""}
                placement={"top"}
                followCursor={true}
                key={cell.key ?? `column-${index}`}
              >
                <TableCell
                  align={
                    cell.iconCell ? "center" : cell.numeric ? "right" : "left"
                  }
                  sortDirection={
                    cell.key && sortKey === cell.key ? sortDir : false
                  }
                  sx={cell.iconCell ? iconCellSx : { width: cell.width }}
                >
                  {cell.key ? (
                    <TableSortLabel
                      active={sortKey === cell.key}
                      direction={sortKey === cell.key ? sortDir : "asc"}
                      onClick={() => onSort(cell.key!)}
                    >
                      {cell.label}
                    </TableSortLabel>
                  ) : (
                    cell.label
                  )}
                </TableCell>
              </Tooltip>
            ))}
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r) => (
            <Fragment key={r.deedUid}>
              <TableRow hover>
                <TableCell>{r.label}</TableCell>
                <TableCell sx={iconCellSx}>
                  <Tooltip
                    title={r.rarity}
                    placement={"top"}
                    followCursor={true}
                  >
                    <span>
                      <Image
                        src={rarityIcon(r.rarity)}
                        alt={r.rarity}
                        width={18}
                        height={18}
                      />
                    </span>
                  </Tooltip>
                </TableCell>
                <TableCell sx={iconCellSx}>
                  <Tooltip
                    title={r.plotStatus}
                    placement={"top"}
                    followCursor={true}
                  >
                    <span>
                      <Image
                        src={plotStatusIcon(r.plotStatus)}
                        alt={r.plotStatus}
                        width={18}
                        height={18}
                      />
                    </span>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" noWrap>
                    {r.regionName || r.regionNumber}
                  </Typography>
                </TableCell>
                <TableCell>
                  {capitalize(worksiteLabel(r.worksiteType).toLowerCase())}
                </TableCell>
                <TableCell align="right">
                  {r.rewardsPerHour > 0 ? (
                    <Tooltip
                      key={r.tokenSymbol}
                      title={capitalize(r.tokenSymbol.toLowerCase())}
                      placement={"top"}
                      followCursor={true}
                    >
                      <Chip
                        variant={"outlined"}
                        icon={getResourceIcon(r.tokenSymbol as Resource)}
                        label={fmt(r.rewardsPerHour)}
                        size="small"
                        sx={{
                          borderColor: RESOURCE_COLOR_MAP[r.tokenSymbol],
                          fontWeight: "bold",
                        }}
                      />
                    </Tooltip>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell align="right">
                  <Stack
                    direction="row"
                    gap={0.25}
                    alignItems="center"
                    justifyContent="flex-end"
                  >
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
                    {r.netDecEstimated && (
                      <Tooltip title={TAX_ESTIMATE_NOTE}>
                        <WarningAmberIcon
                          fontSize="inherit"
                          color="warning"
                          sx={{ cursor: "help" }}
                        />
                      </Tooltip>
                    )}
                  </Stack>
                </TableCell>
                <TableCell align="right">{fmtPP(r.basePP)}</TableCell>
                <TableCell align="right">{fmtPP(r.boostedPP)}</TableCell>
                <TableCell align="left">
                  {r.powered ? (
                    <CheckCircleIcon
                      sx={{ fontSize: 16, color: "success.main" }}
                    />
                  ) : (
                    <CancelIcon sx={{ fontSize: 16, color: "error.main" }} />
                  )}
                </TableCell>
                <TableCell>
                  {showPositiveTerrainBoosts(r.biomeModifiers)}
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
                        r.workerCount > 0
                          ? "Remove workers (and Runi)"
                          : "No workers"
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
