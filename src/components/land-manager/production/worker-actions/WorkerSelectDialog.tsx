"use client";

import LandCardFilter from "@/components/cards/LandCardFilter";
import CardTableIcon from "@/components/player-overview/collection-overview/CardTableIcon";
import FoilIcon from "@/components/ui/FoilIcon";
import ScrollableTableContainer from "@/components/ui/ScrollableTableContainer";
import { usePersistedCardFilters } from "@/hooks/usePersistedCardFilters";
import { getPlayerLandCards } from "@/lib/backend/actions/player/landCards-actions";
import { filterAvailableCards } from "@/lib/frontend/utils/landCardFilters";
import { land_hammer_icon_url } from "@/lib/shared/statics_icon_urls";
import { foilLabel } from "@/lib/utils/cardUtil";
import { formatDate, formatRelativeDate } from "@/lib/utils/dateColumnUtils";
import { CardFilterOptions } from "@/types/cardFilter";
import { DeedComplete } from "@/types/deed";
import { cardSetIconMap, editionMap } from "@/types/editions";
import { cardFoilOptions, cardIconMap } from "@/types/planner/primitives";
import { PlayerLandCard } from "@/types/playerLandCard";
import {
  Alert,
  Avatar,
  Box,
  Button,
  capitalize,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SpotCardVM } from "../productionConfigTypes";
import { scoreLandCard } from "./workerScoring";

type WorkerSortKey =
  | "img"
  | "name"
  | "rarity"
  | "set"
  | "edition"
  | "foil"
  | "lastUsed"
  | "bcx"
  | "basePP"
  | "boostedPP";
type SortDir = "asc" | "desc";
const CARD_TABLE_ROWS_PER_PAGE_OPTIONS = [50, 100, 200];

// Short labels keep the table narrow; the full name lives in the tooltip.
const HEAD_CELLS: {
  key: WorkerSortKey;
  label: string;
  numeric: boolean;
  tooltip?: string;
}[] = [
  { key: "img", label: "_", numeric: false },
  { key: "name", label: "Card", numeric: false },
  { key: "rarity", label: "R", numeric: false, tooltip: "Rarity" },
  { key: "set", label: "S", numeric: false, tooltip: "Set" },
  { key: "edition", label: "E", numeric: false, tooltip: "Edition" },
  { key: "foil", label: "F", numeric: false, tooltip: "Foil" },
  {
    key: "bcx",
    label: "CC",
    numeric: true,
    tooltip: "Cards Combined (formerly known as BCX)",
  },
  { key: "basePP", label: "Base PP", numeric: true },
  { key: "boostedPP", label: "Boosted PP", numeric: true },
  { key: "lastUsed", label: "Last Played", numeric: false },
];

/** Epoch ms of a card's last play, 0 when never played or unknown. */
function lastUsedTime(card: SpotCardVM): number {
  if (!card.lastUsedDate) return 0;
  const t = new Date(card.lastUsedDate).getTime();
  return Number.isFinite(t) ? t : 0;
}

function compareRows(a: SpotCardVM, b: SpotCardVM, key: WorkerSortKey): number {
  switch (key) {
    case "img":
    case "name":
      return a.name.localeCompare(b.name);
    case "rarity":
      return a.rarity.localeCompare(b.rarity);
    case "edition":
      return a.edition - b.edition;
    case "set":
      return a.set.localeCompare(b.set);
    case "foil":
      return a.foil - b.foil;
    case "lastUsed":
      // Never played sorts as oldest, so it lands last when sorting descending.
      return lastUsedTime(a) - lastUsedTime(b);
    case "bcx":
      return a.bcx - b.bcx;
    case "basePP":
      return a.basePP - b.basePP;
    case "boostedPP":
      return a.boostedPP - b.boostedPP;
  }
}

/** Persistence scope: the worker picker's own saved filter settings. */
const CARD_FILTER_SCOPE_WORKER_SELECT = "production-worker-select";

const DEFAULT_CARD_FILTER: CardFilterOptions = {
  cardName: "",
  rarities: [],
  sets: [],
  editions: [],
  promoSets: [],
  rewardSets: [],
  extraSets: [],
  elements: [],
  foils: [],
  minPP: 0,
  maxPP: 0,
  bloodlines: [],
  maxLevelOnly: false,
};

/** Relative "last played" age, with the absolute date in the tooltip. */
function LastPlayedCell({ date }: Readonly<{ date?: string | null }>) {
  const parsed = date ? new Date(date) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) {
    return (
      <Typography variant="body2" color="text.secondary">
        -
      </Typography>
    );
  }
  return (
    <Tooltip title={formatDate(parsed)} placement="top">
      <Typography variant="body2" noWrap>
        {formatRelativeDate(parsed)}
      </Typography>
    </Tooltip>
  );
}

function fmt(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

interface Props {
  open: boolean;
  deed: DeedComplete;
  username: string;
  /** How many worker cards may be selected (empty slots on the plot). */
  emptySlots: number;
  /** Card UIDs to exclude (already staged on this plot / staged elsewhere). */
  excludeUids: string[];
  onClose: () => void;
  onConfirm: (picks: SpotCardVM[]) => void;
}

function isLandSelectable(
  card: SpotCardVM,
  isSelected: boolean,
  selected: number,
  emptySlots: number
): {
  valid: boolean;
  reason: string;
} {
  // Check if the card's set is valid for this deed.
  if (card.inSet) {
    return { valid: false, reason: "Card is part of set" };
  } else if (card.onWagon) {
    return { valid: false, reason: "Card is on wagon" };
  } else if (card.isListed) {
    return { valid: false, reason: "Card is listed" };
  } else if (card.isOnCooldown) {
    return { valid: false, reason: "Card is on cooldown" };
  } else if (!isSelected && selected >= emptySlots) {
    return { valid: false, reason: "No empty slots available" };
  }
  return { valid: true, reason: "" };
}
export default function WorkerSelectDialog({
  open,
  deed,
  username,
  emptySlots,
  excludeUids,
  onClose,
  onConfirm,
}: Props) {
  const [cards, setCards] = useState<PlayerLandCard[] | null>(null);
  // Mounted on demand, so it always opens in a loading state.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const {
    filters: filter,
    setFilters: setFilter,
    resetFilters: resetFilter,
  } = usePersistedCardFilters(
    CARD_FILTER_SCOPE_WORKER_SELECT,
    DEFAULT_CARD_FILTER
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<WorkerSortKey>("boostedPP");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [boostedJumpInput, setBoostedJumpInput] = useState("");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  const handleSort = (key: WorkerSortKey) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "name" || key === "set" ? "asc" : "desc");
    }
  };

  // Load the player's land-eligible cards (excludes cards staked on land).
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    getPlayerLandCards(username)
      .then((data) => {
        if (cancelled) return;
        setCards(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load cards");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, username]);

  const excludeSet = useMemo(() => new Set(excludeUids), [excludeUids]);

  // Filter (sidebar) then score + sort on the chosen column. Cards already
  // staked on land are always excluded — you can't stake them elsewhere.
  const rows = useMemo(() => {
    if (!cards) return [];
    const available = cards.filter((c) => !c.onLand);
    const filtered = filterAvailableCards(available, excludeSet, filter);
    const scored = filtered.map((card) => scoreLandCard(card, deed));
    const mul = sortDir === "asc" ? 1 : -1;
    return scored.sort((a, b) => compareRows(a, b, sortKey) * mul);
  }, [cards, excludeSet, filter, deed, sortKey, sortDir]);

  const toggle = (uid: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else if (next.size < emptySlots) next.add(uid);
      return next;
    });
  };

  const handleConfirm = () => {
    if (!cards) return;
    // Resolve selections against the full card list, not the currently-filtered
    // `rows`: a card selected before a filter change must survive that change.
    const byUid = new Map(cards.map((c) => [c.uid, c]));
    const picks = [...selected]
      .map((uid) => byUid.get(uid))
      .filter((c): c is PlayerLandCard => Boolean(c))
      .map((card) => scoreLandCard(card, deed));
    onConfirm(picks);
  };

  const jumpToBoostedPP = useCallback(
    (rawValue: string) => {
      const trimmed = rawValue.trim();
      if (!trimmed || rows.length === 0) return;

      const target = Number(trimmed);
      if (!Number.isFinite(target)) return;

      let bestIndex = -1;
      let bestDistance = Number.POSITIVE_INFINITY;
      let bestValue = Number.POSITIVE_INFINITY;

      rows.forEach((row, index) => {
        const value = row.boostedPP;
        const distance = Math.abs(value - target);
        if (
          distance < bestDistance ||
          (distance === bestDistance &&
            (value < bestValue || (value === bestValue && index < bestIndex)))
        ) {
          bestIndex = index;
          bestDistance = distance;
          bestValue = value;
        }
      });

      if (bestIndex >= 0) {
        setPage(Math.floor(bestIndex / rowsPerPage));
      }
    },
    [rows, rowsPerPage]
  );

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      jumpToBoostedPP(boostedJumpInput);
    }, 500);
    return () => clearTimeout(timer);
  }, [boostedJumpInput, jumpToBoostedPP, open]);

  const paginated = rows.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>
        Select workers · up to {emptySlots} ({selected.size} selected)
      </DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 1 }}>
            {error}
          </Alert>
        )}
        <Alert severity="info" sx={{ mb: 1 }}>
          Cards already staked on land are hidden. Only land-valid sets and
          editions are shown — other sets/editions are filtered out.
        </Alert>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              alignItems: "flex-start",
            }}
          >
            {/* Filter sidebar */}
            <Box sx={{ width: 280, flexShrink: 0 }}>
              <LandCardFilter
                cards={cards ?? []}
                filteredCardCount={rows.length}
                filterOptions={filter}
                onFilterChange={setFilter}
                onResetFilters={resetFilter}
              />
            </Box>

            {/* Sorted card table */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                minWidth: 0,
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
                <TextField
                  size="small"
                  label="Jump to Boosted PP"
                  placeholder="e.g. 1200"
                  value={boostedJumpInput}
                  onChange={(e) => setBoostedJumpInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      jumpToBoostedPP(boostedJumpInput);
                    }
                  }}
                  sx={{ width: 220 }}
                />
              </Box>

              <Box
                sx={{
                  flex: 1,
                  minWidth: 0,
                  maxHeight: "100vh",
                  overflow: "auto",
                }}
              >
                <ScrollableTableContainer>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox" />
                        {HEAD_CELLS.map((cell) => (
                          <TableCell
                            key={cell.key}
                            align={cell.numeric ? "right" : "left"}
                            sortDirection={
                              sortKey === cell.key ? sortDir : false
                            }
                          >
                            <Tooltip title={cell.tooltip ?? ""} placement="top">
                              <TableSortLabel
                                active={sortKey === cell.key}
                                direction={
                                  sortKey === cell.key ? sortDir : "asc"
                                }
                                onClick={() => handleSort(cell.key)}
                              >
                                {cell.label}
                              </TableSortLabel>
                            </Tooltip>
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginated.map((r) => {
                        const isSelected = selected.has(r.uid);
                        const { valid, reason } = isLandSelectable(
                          r,
                          isSelected,
                          selected.size,
                          emptySlots
                        );
                        const disabled = !valid;
                        return (
                          <TableRow
                            key={r.uid}
                            hover
                            selected={isSelected}
                            onClick={() => !disabled && toggle(r.uid)}
                            sx={{ cursor: disabled ? "default" : "pointer" }}
                          >
                            <Tooltip
                              title={disabled ? reason : ""}
                              placement="top"
                            >
                              <TableCell padding="checkbox">
                                <Checkbox
                                  size="small"
                                  checked={isSelected}
                                  disabled={disabled}
                                />
                              </TableCell>
                            </Tooltip>
                            <TableCell>
                              {(() => {
                                return CardTableIcon({ card: r });
                              })()}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" noWrap>
                                {r.name}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ textTransform: "capitalize" }}>
                              <Avatar
                                src={cardIconMap[r.rarity]}
                                sx={{ width: 24, height: 24 }}
                              />
                            </TableCell>
                            <TableCell sx={{ textTransform: "capitalize" }}>
                              <Image
                                src={
                                  cardSetIconMap[r.set] ?? land_hammer_icon_url
                                }
                                alt={capitalize(r.set)}
                                width={24}
                                height={24}
                                style={{ objectFit: "contain" }}
                              />
                            </TableCell>
                            <TableCell sx={{ textTransform: "capitalize" }}>
                              <Image
                                src={
                                  editionMap[r.edition].editionIcon ??
                                  land_hammer_icon_url
                                }
                                alt={capitalize(
                                  editionMap[r.edition].displayName
                                )}
                                width={24}
                                height={24}
                                style={{ objectFit: "contain" }}
                                title={capitalize(
                                  editionMap[r.edition].displayName
                                )}
                              />
                            </TableCell>
                            <TableCell align="left">
                              <Tooltip
                                title={foilLabel(r.foil)}
                                placement="top"
                              >
                                <Box
                                  sx={{ display: "inline-flex" }}
                                  aria-label={foilLabel(r.foil)}
                                >
                                  <FoilIcon
                                    foil={cardFoilOptions[r.foil] ?? "regular"}
                                    size={20}
                                    fontSizeRatio={0.6}
                                    fontWeight={900}
                                  />
                                </Box>
                              </Tooltip>
                            </TableCell>
                            <TableCell align="right">
                              {r.bcx}/{r.maxBcx}
                            </TableCell>
                            <TableCell align="right">{fmt(r.basePP)}</TableCell>
                            <TableCell align="right">
                              <Typography
                                variant="body2"
                                fontWeight={600}
                                color={
                                  r.boostedPP > r.basePP
                                    ? "success.main"
                                    : r.boostedPP < r.basePP
                                      ? "error.main"
                                      : "text.primary"
                                }
                              >
                                {fmt(r.boostedPP)}
                              </Typography>
                            </TableCell>
                            <TableCell align="left">
                              <LastPlayedCell date={r.lastUsedDate} />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {rows.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={HEAD_CELLS.length + 1}
                            align="center"
                          >
                            <Typography color="text.secondary" sx={{ py: 3 }}>
                              No available cards match the filters.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollableTableContainer>
              </Box>
              <TablePagination
                component="div"
                count={rows.length}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={CARD_TABLE_ROWS_PER_PAGE_OPTIONS}
              />
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={selected.size === 0}
        >
          Add {selected.size > 0 ? `${selected.size} ` : ""}worker
          {selected.size !== 1 ? "s" : ""}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
