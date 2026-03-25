"use client";

import {
  getLandCardCollectionData,
  LandCardCollectionResult,
  LandCardSetSummary,
} from "@/lib/backend/actions/region/land-card-collection-actions";
import { useFilters } from "@/lib/frontend/context/FilterContext";
import WeeklyDataAlert from "@/components/ui/WeeklyDataAlert";
import {
  Alert,
  Box,
  Chip,
  Collapse,
  IconButton,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { useEffect, useState, useTransition } from "react";

const FOIL_COLORS = {
  regular: "#aaa",
  gold: "#fdd835",
  gold_arcane: "#ffb300",
  black: "#0e1717",
  black_arcane: "#320067",
} as const;

const RARITY_LABELS: Record<number, string> = {
  1: "Common",
  2: "Rare",
  3: "Epic",
  4: "Legendary",
};

const RARITY_COLORS: Record<number, string> = {
  1: "#aaa",
  2: "#0757ec",
  3: "#9c27b0",
  4: "#ff9800",
};

function RarityLevelSubTable({
  rarity_level_counts,
}: Readonly<{
  rarity_level_counts: Record<string, Record<string, number>>;
}>) {
  const entries = Object.entries(rarity_level_counts);

  if (entries.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
        No data
      </Typography>
    );
  }

  return (
    <Box sx={{ p: 1 }}>
      {entries
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([rarity, levels]) => (
          <Box key={rarity} sx={{ mb: 1 }}>
            <Typography
              variant="caption"
              fontWeight="bold"
              sx={{ color: RARITY_COLORS[Number(rarity)] ?? "text.primary" }}
            >
              {RARITY_LABELS[Number(rarity)] ?? `Rarity ${rarity}`}
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
              {Object.entries(levels)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([level, count]) => (
                  <Chip
                    key={level}
                    size="small"
                    label={`Lv${level}: ${count.toLocaleString()}`}
                    sx={{ fontSize: 11 }}
                  />
                ))}
            </Box>
          </Box>
        ))}
    </Box>
  );
}

function CardSetRow({ row }: Readonly<{ row: LandCardSetSummary }>) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow hover>
        <TableCell sx={{ width: 40, p: 0.5 }}>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Typography
            variant="body2"
            fontWeight="bold"
            sx={{ textTransform: "capitalize" }}
          >
            {row.card_set}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.player_count} player{row.player_count !== 1 ? "s" : ""}
          </Typography>
        </TableCell>
        <TableCell align="right">{row.total_cards.toLocaleString()}</TableCell>
        <TableCell align="right" sx={{ color: FOIL_COLORS.regular }}>
          {row.foil_regular.toLocaleString()}
        </TableCell>
        <TableCell align="right" sx={{ color: FOIL_COLORS.gold }}>
          {row.foil_gold.toLocaleString()}
        </TableCell>
        <TableCell align="right" sx={{ color: FOIL_COLORS.gold_arcane }}>
          {row.foil_gold_arcane.toLocaleString()}
        </TableCell>
        <TableCell align="right" sx={{ color: FOIL_COLORS.black }}>
          {row.foil_black.toLocaleString()}
        </TableCell>
        <TableCell align="right" sx={{ color: FOIL_COLORS.black_arcane }}>
          {row.foil_black_arcane.toLocaleString()}
        </TableCell>
        <TableCell align="right">{row.owned.toLocaleString()}</TableCell>
        <TableCell align="right">{row.rented.toLocaleString()}</TableCell>
        <TableCell align="right">{row.delegated.toLocaleString()}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell
          colSpan={11}
          sx={{ pb: 0, pt: 0, borderBottom: open ? undefined : "none" }}
        >
          <Collapse in={open} timeout="auto" unmountOnExit>
            <RarityLevelSubTable
              rarity_level_counts={row.rarity_level_counts}
            />
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export function CardCollectionPage() {
  const [data, setData] = useState<LandCardCollectionResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const { filters } = useFilters();

  useEffect(() => {
    if (!filters) return;

    startTransition(async () => {
      try {
        const result = await getLandCardCollectionData({
          filter_players: filters.filter_players ?? [],
        });
        setData(result);
      } catch (error) {
        console.error("Failed to load card collection data:", error);
      }
    });
  }, [filters]);

  if (isPending && !data) {
    return (
      <Box sx={{ p: 2 }}>
        <Skeleton variant="rectangular" width="100%" height={400} />
      </Box>
    );
  }

  if (!data || data.editionSummary.length === 0) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="info">
          No card collection data available yet. This data is computed during
          the weekly scan.
        </Alert>
      </Box>
    );
  }

  const totalCards = data.editionSummary.reduce(
    (sum, r) => sum + r.total_cards,
    0
  );

  return (
    <Box sx={{ mt: 2 }}>
      <WeeklyDataAlert
        lastUpdated={data.lastUpdated}
        label="Card collection data"
      />

      <Box display="flex" gap={2} mb={2} flexWrap="wrap">
        <Paper sx={{ p: 2, borderRadius: 2, minWidth: 140 }}>
          <Typography variant="caption" color="text.secondary">
            Total Cards on Land
          </Typography>
          <Typography variant="h6" fontWeight="bold">
            {totalCards.toLocaleString()}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, borderRadius: 2, minWidth: 140 }}>
          <Typography variant="caption" color="text.secondary">
            Card sets tracked
          </Typography>
          <Typography variant="h6" fontWeight="bold">
            {data.editionSummary.length}
          </Typography>
        </Paper>
      </Box>

      <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>Card Set</TableCell>
              <Tooltip title="Total cards currently staked on land plots">
                <TableCell align="right">Total</TableCell>
              </Tooltip>
              <Tooltip title="Regular (foil type 0)">
                <TableCell align="right" sx={{ color: FOIL_COLORS.regular }}>
                  Regular
                </TableCell>
              </Tooltip>
              <Tooltip title="Gold foil (foil type 1)">
                <TableCell align="right" sx={{ color: FOIL_COLORS.gold }}>
                  Gold
                </TableCell>
              </Tooltip>
              <Tooltip title="Gold Arcane foil (foil type 2)">
                <TableCell
                  align="right"
                  sx={{ color: FOIL_COLORS.gold_arcane }}
                >
                  Gold Arc.
                </TableCell>
              </Tooltip>
              <Tooltip title="Black foil (foil type 3)">
                <TableCell align="right" sx={{ color: FOIL_COLORS.black }}>
                  Black
                </TableCell>
              </Tooltip>
              <Tooltip title="Black Arcane foil (foil type 4)">
                <TableCell
                  align="right"
                  sx={{ color: FOIL_COLORS.black_arcane }}
                >
                  Black Arc.
                </TableCell>
              </Tooltip>
              <Tooltip title="Cards owned by the player, not delegated">
                <TableCell align="right">Owned</TableCell>
              </Tooltip>
              <Tooltip title="Cards with an active rental period">
                <TableCell align="right">Rented</TableCell>
              </Tooltip>
              <Tooltip title="Cards delegated to another player">
                <TableCell align="right">Delegated</TableCell>
              </Tooltip>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.editionSummary.map((row) => (
              <CardSetRow key={row.card_set} row={row} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mt: 1, display: "block" }}
      >
        Click the arrow on any row to see a breakdown by rarity and level. Only
        cards actively staked on a land plot are included.
      </Typography>
    </Box>
  );
}
