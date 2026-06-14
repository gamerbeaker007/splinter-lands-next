"use client";

import PlaygroundCardFilter from "@/components/planning/playground/PlaygroundCardFilter";
import { filterAvailableCards } from "@/components/planning/playground/util/deedFilters";
import CardTableIcon from "@/components/player-overview/collection-overview/CardTableIcon";
import ScrollableTableContainer from "@/components/ui/ScrollableTableContainer";
import { getPlaygroundData } from "@/lib/backend/actions/player/playground-actions";
import { land_hammer_icon_url } from "@/lib/shared/statics_icon_urls";
import { CardFilterOptions } from "@/types/cardFilter";
import { DeedComplete } from "@/types/deed";
import { cardSetIconMap, editionMap } from "@/types/editions";
import { cardIconMap } from "@/types/planner/primitives";
import { PlaygroundCard } from "@/types/playground";
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
  Tooltip,
  Typography,
} from "@mui/material";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { SpotCardVM } from "./productionConfigTypes";
import { scorePlaygroundCard } from "./workerScoring";

type WorkerSortKey =
  | "img"
  | "name"
  | "rarity"
  | "set"
  | "edition"
  | "bcx"
  | "basePP"
  | "boostedPP";
type SortDir = "asc" | "desc";
const CARD_TABLE_ROWS_PER_PAGE_OPTIONS = [50, 100, 200];

const HEAD_CELLS: { key: WorkerSortKey; label: string; numeric: boolean }[] = [
  { key: "img", label: "_", numeric: false },
  { key: "name", label: "Card", numeric: false },
  { key: "rarity", label: "Rarity", numeric: false },
  { key: "set", label: "Set", numeric: false },
  { key: "edition", label: "Edition", numeric: false },
  { key: "bcx", label: "BCX", numeric: true },
  { key: "basePP", label: "Base PP", numeric: true },
  { key: "boostedPP", label: "Boosted PP", numeric: true },
];

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
    case "bcx":
      return a.bcx - b.bcx;
    case "basePP":
      return a.basePP - b.basePP;
    case "boostedPP":
      return a.boostedPP - b.boostedPP;
  }
}

const DEFAULT_CARD_FILTER: CardFilterOptions = {
  rarities: [],
  sets: [],
  editions: [],
  promoSets: [],
  rewardSets: [],
  extraSets: [],
  elements: [],
  foils: [],
  minPP: 0,
};

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
  const [cards, setCards] = useState<PlaygroundCard[] | null>(null);
  // Mounted on demand, so it always opens in a loading state.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<CardFilterOptions>(DEFAULT_CARD_FILTER);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<WorkerSortKey>("boostedPP");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

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
    getPlaygroundData(username)
      .then((data) => {
        if (cancelled) return;
        setCards(data.cards);
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
    const scored = filtered.map((card) => scorePlaygroundCard(card, deed));
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
    const picks = rows.filter((r) => selected.has(r.uid));
    onConfirm(picks);
  };

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
              <PlaygroundCardFilter
                cards={cards ?? []}
                filteresCardCount={rows.length}
                filterOptions={filter}
                onFilterChange={setFilter}
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
              <Box
                sx={{
                  flex: 1,
                  minWidth: 0,
                  maxHeight: "60vh",
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
                            <TableSortLabel
                              active={sortKey === cell.key}
                              direction={sortKey === cell.key ? sortDir : "asc"}
                              onClick={() => handleSort(cell.key)}
                            >
                              {cell.label}
                            </TableSortLabel>
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
                          </TableRow>
                        );
                      })}
                      {rows.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} align="center">
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
