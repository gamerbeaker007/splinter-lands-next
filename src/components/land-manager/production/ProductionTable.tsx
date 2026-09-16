"use client";

import { renderResourceChip } from "@/components/ui/resource/Resource";
import { Resource } from "@/constants/resource/resource";
import { ProductionActionKind } from "@/hooks/useProductionPlotActions";
import { formatInt, formatNumber } from "@/lib/formatters";
import { getElementIconUrl } from "@/lib/frontend/utils/icons";
import {
  land_default_off_icon_url_placeholder,
  land_mythic_icon_url,
  land_runi_power_core_icon_url,
  WEB_URL,
} from "@/lib/shared/statics_icon_urls";
import { TAX_ESTIMATE_NOTE } from "@/lib/shared/taxProduction";
import { BiomeModifiers } from "@/lib/utils/cardUtil";
import {
  ArrowDownward as ArrowDownwardIcon,
  DeleteSweep as DeleteSweepIcon,
  MoreVert as MoreVertIcon,
  PersonRemove as PersonRemoveIcon,
  PowerOff as PowerOffIcon,
  PowerSettingsNew as PowerOnIcon,
  Tune as TuneIcon,
  WarningAmber as WarningAmberIcon,
} from "@mui/icons-material";
import CancelIcon from "@mui/icons-material/Cancel";
import {
  Avatar,
  Box,
  capitalize,
  Collapse,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
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
  type SxProps,
  type Theme,
} from "@mui/material";
import Image from "next/image";
import { Fragment, ReactNode, useState } from "react";
import {
  ProductionRow,
  ProductionSortKey,
  SortDirection,
  worksiteLabel,
} from "./productionTypes";

type ColumnId =
  | "actions"
  | "plot"
  | "rarity"
  | "plotStatus"
  | "region"
  | "worksite"
  | "rewards"
  | "netDec"
  | "basePP"
  | "boostedPP"
  | "powered"
  | "boosts"
  | "workers";

interface HeadCell {
  id: ColumnId;
  /** Column this sorts by; omit when the column has nothing to sort on. */
  sortKey?: ProductionSortKey;
  label: string;
  /** Abbreviation shown when the table is too narrow for the full label. */
  shortLabel?: string;
  /** Header tooltip — falls back to the label, so short labels stay readable. */
  tooltip?: string;
  numeric: boolean;
  sortable: boolean;
  /** Lower bound for the column; the browser may grow it past this. */
  minWidth?: number;
  /** Upper bound; longer content is ellipsised rather than widening the table. */
  maxWidth?: number;
}

const HEAD_CELLS: HeadCell[] = [
  {
    id: "actions",
    label: "Actions",
    numeric: false,
    sortable: false,
  },
  {
    id: "plot",
    sortKey: "label",
    label: "Plot",
    numeric: false,
    sortable: true,
    minWidth: 90,
  },
  {
    id: "rarity",
    sortKey: "rarity",
    label: "Rarity",
    shortLabel: "R",
    numeric: false,
    sortable: true,
  },
  {
    id: "plotStatus",
    sortKey: "plotStatus",
    label: "Status",
    shortLabel: "S",
    tooltip: "Plot Status",
    numeric: false,
    sortable: true,
  },
  {
    id: "region",
    sortKey: "regionNumber",
    label: "Region",
    numeric: false,
    sortable: true,
    minWidth: 72,
    maxWidth: 120,
  },
  {
    id: "worksite",
    sortKey: "worksiteType",
    label: "Worksite",
    numeric: false,
    sortable: true,
    minWidth: 84,
    maxWidth: 140,
  },
  {
    id: "rewards",
    sortKey: "rewardsPerHour",
    label: "Rewards/hr",
    numeric: true,
    sortable: true,
    minWidth: 104,
  },
  {
    id: "netDec",
    sortKey: "netDEC",
    label: "Net DEC/hr",
    shortLabel: "D/hr",
    numeric: true,
    sortable: true,
    minWidth: 96,
  },
  {
    id: "basePP",
    sortKey: "basePP",
    label: "Base PP",
    shortLabel: "BaPP",
    numeric: true,
    sortable: true,
    minWidth: 72,
  },
  {
    id: "boostedPP",
    sortKey: "boostedPP",
    label: "Boosted PP",
    shortLabel: "BoPP",
    numeric: true,
    sortable: true,
    minWidth: 84,
  },
  {
    id: "powered",
    sortKey: "powered",
    label: "Powered",
    shortLabel: "P",
    numeric: false,
    sortable: true,
  },
  {
    id: "boosts",
    label: "Boosts",
    shortLabel: "B",
    tooltip: "Positive Terrain Boosts",
    numeric: false,
    sortable: false,
  },
  {
    id: "workers",
    sortKey: "workerCount",
    label: "Workers",
    numeric: true,
    sortable: true,
    minWidth: 64,
  },
];

/**
 * Width reserved at the right of every sortable column for the sort arrow.
 *
 * The arrow is drawn absolutely rather than inline, and the gutter is applied
 * to the header *and* the body cells — so the header label lines up exactly
 * with the column's content, and sorting never shifts the layout.
 */
const SORT_GUTTER = "14px";

function columnSx(cell: HeadCell): SxProps<Theme> {
  // Tight vertical rhythm — the table is dense enough that the default
  // `size="small"` padding is the main thing costing height.
  return {
    py: 0.25,
    pl: 0.5,
    pr: cell.sortable ? SORT_GUTTER : 0.5,
    minWidth: cell.minWidth,
    maxWidth: cell.maxWidth,
    ...(cell.maxWidth
      ? { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }
      : null),
  };
}

function columnAlign(cell: HeadCell): "left" | "right" {
  return cell.numeric ? "right" : "left";
}

const COLUMNS = Object.fromEntries(
  HEAD_CELLS.map((cell) => [cell.id, cell])
) as Record<ColumnId, HeadCell>;

/**
 * Alignment and sizing for one column, shared by its header and body cells so
 * the two can never drift apart.
 */
function cellProps(id: ColumnId): {
  align: "left" | "right";
  sx: SxProps<Theme>;
} {
  const cell = COLUMNS[id];
  return { align: columnAlign(cell), sx: columnSx(cell) };
}

/**
 * Full labels are shown when the table has room; below that the abbreviation
 * takes over, with the full name still in the tooltip. A container query
 * rather than a viewport one, so docking the filter panel switches them too.
 */
const FULL_LABEL_QUERY = "@container production-table (min-width: 1280px)";

function HeaderLabel({ cell }: { cell: HeadCell }) {
  if (!cell.shortLabel) return <>{cell.label}</>;
  return (
    <>
      <Box component="span" sx={{ [FULL_LABEL_QUERY]: { display: "none" } }}>
        {cell.shortLabel}
      </Box>
      <Box
        component="span"
        sx={{ display: "none", [FULL_LABEL_QUERY]: { display: "inline" } }}
      >
        {cell.label}
      </Box>
    </>
  );
}

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

const COLUMN_COUNT = HEAD_CELLS.length;

function rarityIcon(rarity: string): string {
  return rarity === "mythic"
    ? land_mythic_icon_url
    : land_default_off_icon_url_placeholder.replace("__NAME__", rarity);
}

function isMagical(plotStatus: string): boolean {
  return plotStatus.toLowerCase() === "magical";
}

function plotStatusIcon(plotStatus: string): string {
  const landPlotIconUrl = `${WEB_URL}website/ui_elements/lands/sideMenu/__NAME__Off.svg`;
  return landPlotIconUrl.replace("__NAME__", plotStatus.toLowerCase());
}

function showPositiveTerrainBoosts(biomeModifiers: BiomeModifiers) {
  return (
    <Stack direction="row" spacing={0.25}>
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
                  height: 18,
                  width: 18,
                }}
              />
            </Tooltip>
          );
        })}
    </Stack>
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
  const [actionMenu, setActionMenu] = useState<{
    anchorEl: HTMLElement;
    row: ProductionRow;
  } | null>(null);

  const closeActionMenu = () => setActionMenu(null);

  const runAction = (kind: ProductionActionKind) => {
    if (actionMenu) onAction(kind, actionMenu.row);
    closeActionMenu();
  };

  const menuRow = actionMenu?.row;

  return (
    <>
      <TableContainer
        sx={{ containerType: "inline-size", containerName: "production-table" }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {HEAD_CELLS.map((cell) => (
                <TableCell
                  key={cell.id}
                  {...cellProps(cell.id)}
                  sortDirection={
                    cell.sortKey && sortKey === cell.sortKey ? sortDir : false
                  }
                  sx={{ ...columnSx(cell), position: "relative" }}
                >
                  <Tooltip
                    title={cell.tooltip ?? cell.label}
                    placement={"top"}
                    followCursor={true}
                  >
                    {cell.sortable && cell.sortKey ? (
                      <TableSortLabel
                        active={sortKey === cell.sortKey}
                        direction={sortKey === cell.sortKey ? sortDir : "asc"}
                        onClick={() => onSort(cell.sortKey!)}
                        // The arrow is drawn in the gutter below instead, so the
                        // label keeps the column's own alignment.
                        sx={{
                          "& .MuiTableSortLabel-icon": { display: "none" },
                        }}
                      >
                        <HeaderLabel cell={cell} />
                      </TableSortLabel>
                    ) : (
                      <span>
                        <HeaderLabel cell={cell} />
                      </span>
                    )}
                  </Tooltip>
                  {cell.sortKey === sortKey && (
                    <ArrowDownwardIcon
                      sx={{
                        position: "absolute",
                        right: 0,
                        top: "50%",
                        fontSize: 13,
                        color: "text.secondary",
                        pointerEvents: "none",
                        transform:
                          sortDir === "asc"
                            ? "translateY(-50%) rotate(180deg)"
                            : "translateY(-50%)",
                      }}
                    />
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <Fragment key={r.deedUid}>
                <TableRow hover>
                  <TableCell {...cellProps("actions")}>
                    <Stack direction="row" spacing={0}>
                      <Tooltip title="Plot actions">
                        <span>
                          <IconButton
                            size="small"
                            aria-label={`Actions for ${r.label}`}
                            disabled={busy}
                            onClick={(event) =>
                              setActionMenu({
                                anchorEl: event.currentTarget,
                                row: r,
                              })
                            }
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip
                        title={
                          r.listed
                            ? "Plot is listed on the market — cancel the listing to configure"
                            : "Configure plot"
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
                  <TableCell {...cellProps("plot")}>{r.label}</TableCell>
                  <TableCell {...cellProps("rarity")}>
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
                  <TableCell {...cellProps("plotStatus")}>
                    <Stack direction="row" spacing={0.25} alignItems="center">
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
                      {isMagical(r.plotStatus) && r.magicType && (
                        <Tooltip
                          title={`${r.plotStatus}: ${r.magicType}`}
                          placement={"top"}
                          followCursor={true}
                        >
                          <span>
                            <Image
                              src={getElementIconUrl(r.magicType)}
                              alt={r.magicType}
                              width={18}
                              height={18}
                            />
                          </span>
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell {...cellProps("region")}>
                    <Typography variant="body2" noWrap>
                      {r.regionName || r.regionNumber}
                    </Typography>
                  </TableCell>
                  <TableCell {...cellProps("worksite")}>
                    {capitalize(worksiteLabel(r.worksiteType).toLowerCase())}
                  </TableCell>
                  <TableCell {...cellProps("rewards")}>
                    {r.rewardsPerHour > 0
                      ? renderResourceChip(
                          r.tokenSymbol as Resource,
                          r.rewardsPerHour
                        )
                      : "—"}
                  </TableCell>
                  <TableCell {...cellProps("netDec")}>
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
                        {formatNumber(r.netDEC, { maximumFractionDigits: 2 })}
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
                  <TableCell {...cellProps("basePP")}>
                    {formatInt(r.basePP)}
                  </TableCell>
                  <TableCell {...cellProps("boostedPP")}>
                    {formatInt(r.boostedPP)}
                  </TableCell>
                  <TableCell {...cellProps("powered")}>
                    {r.powered ? (
                      <Avatar
                        src={land_runi_power_core_icon_url}
                        alt={"Powered"}
                        sx={{ width: 16, height: 16 }}
                      />
                    ) : (
                      <CancelIcon sx={{ fontSize: 16, color: "error.main" }} />
                    )}
                  </TableCell>
                  <TableCell {...cellProps("boosts")}>
                    {showPositiveTerrainBoosts(r.biomeModifiers)}
                  </TableCell>
                  <TableCell {...cellProps("workers")}>
                    {r.workerCount}/{r.maxWorkers}
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

      <Menu
        anchorEl={actionMenu?.anchorEl ?? null}
        open={Boolean(actionMenu)}
        onClose={closeActionMenu}
      >
        {menuRow && (
          <MenuItem
            disabled={busy || menuRow.listed}
            onClick={() => runAction(menuRow.powered ? "unpower" : "powerOn")}
          >
            <ListItemIcon>
              {menuRow.powered ? (
                <PowerOffIcon fontSize="small" color="warning" />
              ) : (
                <PowerOnIcon fontSize="small" color="success" />
              )}
            </ListItemIcon>
            <ListItemText>
              {menuRow.powered ? "Unpower" : "Power on"}
            </ListItemText>
          </MenuItem>
        )}
        {menuRow && (
          <MenuItem
            disabled={busy || menuRow.workerCount === 0}
            onClick={() => runAction("removeWorkers")}
          >
            <ListItemIcon>
              <PersonRemoveIcon fontSize="small" color="warning" />
            </ListItemIcon>
            <ListItemText>Remove workers (and Runi)</ListItemText>
          </MenuItem>
        )}
        {menuRow && (
          <MenuItem
            disabled={busy || !menuRow.hasStakedItems}
            onClick={() => runAction("empty")}
          >
            <ListItemIcon>
              <DeleteSweepIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Empty plot</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  );
}
