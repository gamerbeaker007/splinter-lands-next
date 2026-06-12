"use client";

import PlaygroundCardFilter from "@/components/planning/playground/PlaygroundCardFilter";
import { filterAvailableCards } from "@/components/planning/playground/util/deedFilters";
import { getPlaygroundData } from "@/lib/backend/actions/player/playground-actions";
import { CardFilterOptions } from "@/types/cardFilter";
import { DeedComplete } from "@/types/deed";
import { PlaygroundCard } from "@/types/playground";
import {
  Alert,
  Box,
  Button,
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
  TableRow,
  TableSortLabel,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { SpotCardVM } from "./productionConfigTypes";
import { scorePlaygroundCard } from "./workerScoring";

type WorkerSortKey = "name" | "rarity" | "set" | "bcx" | "basePP" | "boostedPP";
type SortDir = "asc" | "desc";

const HEAD_CELLS: { key: WorkerSortKey; label: string; numeric: boolean }[] = [
  { key: "name", label: "Card", numeric: false },
  { key: "rarity", label: "Rarity", numeric: false },
  { key: "set", label: "Set", numeric: false },
  { key: "bcx", label: "BCX", numeric: true },
  { key: "basePP", label: "Base PP", numeric: true },
  { key: "boostedPP", label: "Boosted PP", numeric: true },
];

function compareRows(a: SpotCardVM, b: SpotCardVM, key: WorkerSortKey): number {
  switch (key) {
    case "name":
      return a.name.localeCompare(b.name);
    case "rarity":
      return a.rarity.localeCompare(b.rarity);
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
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
          <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
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
              sx={{ flex: 1, minWidth: 0, maxHeight: "60vh", overflow: "auto" }}
            >
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" />
                    {HEAD_CELLS.map((cell) => (
                      <TableCell
                        key={cell.key}
                        align={cell.numeric ? "right" : "left"}
                        sortDirection={sortKey === cell.key ? sortDir : false}
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
                  {rows.map((r) => {
                    const isSelected = selected.has(r.uid);
                    const disabled = !isSelected && selected.size >= emptySlots;
                    return (
                      <TableRow
                        key={r.uid}
                        hover
                        selected={isSelected}
                        onClick={() => !disabled && toggle(r.uid)}
                        sx={{ cursor: disabled ? "default" : "pointer" }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            size="small"
                            checked={isSelected}
                            disabled={disabled}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap>
                            {r.name}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ textTransform: "capitalize" }}>
                          {r.rarity}
                        </TableCell>
                        <TableCell sx={{ textTransform: "capitalize" }}>
                          {r.set}
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
