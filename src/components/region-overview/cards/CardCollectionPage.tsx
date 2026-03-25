"use client";

import { FullscreenPlotWrapper } from "@/components/ui/graph/FullscreenPlotWrapper";
import WeeklyDataAlert from "@/components/ui/WeeklyDataAlert";
import {
  getLandCardCollectionData,
  LandCardCollectionResult,
  LandCardSetSummary,
} from "@/lib/backend/actions/region/land-card-collection-actions";
import { useFilters } from "@/lib/frontend/context/FilterContext";
import { RarityLevelCounts } from "@/types/LandcardCollection";
import {
  cardFoilOptions,
  CardRarity,
  cardRarityOptions,
  RarityColor,
} from "@/types/planner";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
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
import { useEffect, useState, useTransition } from "react";

const FOIL_COLORS = {
  regular: "#aaa",
  gold: "#fdd835",
  gold_arcane: "#ffb300",
  black: "#0e1717",
  black_arcane: "#320067",
} as const;

const FOIL_PLOT_COLORS: Record<string, string> = {
  regular: "#9e9e9e",
  gold: "#fdd835",
  "gold arcane": "#ffb300",
  black: "#78909c",
  "black arcane": "#ab47bc",
};

function RarityLevelSubTable({
  rarity_level_counts,
}: Readonly<{
  rarity_level_counts: RarityLevelCounts;
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
        .sort(
          ([a], [b]) =>
            cardRarityOptions.indexOf(a) - cardRarityOptions.indexOf(b)
        )
        .map(([rarity, levels]) => (
          <Box key={rarity} sx={{ mb: 1 }}>
            <Typography
              variant="caption"
              fontWeight="bold"
              sx={{
                color: RarityColor[rarity as CardRarity] ?? "text.primary",
              }}
            >
              {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
              {Object.entries(levels)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([level, foils]) => {
                  console.log(`Rarity ${rarity} Level ${level} foils:`, foils);
                  const total = Object.values(foils).reduce<number>(
                    (s, c) => s + (c ?? 0),
                    0
                  );
                  return (
                    <Tooltip
                      key={level}
                      title={
                        <Box>
                          {cardFoilOptions
                            .filter((f) => (foils[f] ?? 0) > 0)
                            .map((f) => (
                              <Box key={f} sx={{ fontSize: 11 }}>
                                {f}: {(foils[f] ?? 0).toLocaleString()}
                              </Box>
                            ))}
                        </Box>
                      }
                    >
                      <Chip
                        size="small"
                        label={`Lv${level}: ${total.toLocaleString()}`}
                        sx={{ fontSize: 11, cursor: "default" }}
                      />
                    </Tooltip>
                  );
                })}
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
        <TableCell
          align="right"
          sx={{
            color: FOIL_COLORS.regular,
            display: { xs: "none", md: "table-cell" },
          }}
        >
          {row.foil_regular.toLocaleString()}
        </TableCell>
        <TableCell
          align="right"
          sx={{
            color: FOIL_COLORS.gold,
            display: { xs: "none", md: "table-cell" },
          }}
        >
          {row.foil_gold.toLocaleString()}
        </TableCell>
        <TableCell
          align="right"
          sx={{
            color: FOIL_COLORS.gold_arcane,
            display: { xs: "none", md: "table-cell" },
          }}
        >
          {row.foil_gold_arcane.toLocaleString()}
        </TableCell>
        <TableCell
          align="right"
          sx={{
            color: FOIL_COLORS.black,
            display: { xs: "none", md: "table-cell" },
          }}
        >
          {row.foil_black.toLocaleString()}
        </TableCell>
        <TableCell
          align="right"
          sx={{
            color: FOIL_COLORS.black_arcane,
            display: { xs: "none", md: "table-cell" },
          }}
        >
          {row.foil_black_arcane.toLocaleString()}
        </TableCell>
        <TableCell
          align="right"
          sx={{ display: { xs: "none", sm: "table-cell" } }}
        >
          {row.owned.toLocaleString()}
        </TableCell>
        <TableCell
          align="right"
          sx={{ display: { xs: "none", sm: "table-cell" } }}
        >
          {row.rented.toLocaleString()}
        </TableCell>
        <TableCell
          align="right"
          sx={{ display: { xs: "none", sm: "table-cell" } }}
        >
          {row.delegated.toLocaleString()}
        </TableCell>
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

function CardCollectionCharts({
  editionSummary,
}: Readonly<{ editionSummary: LandCardSetSummary[] }>) {
  const rarityTotals: Record<string, Record<string, number>> = {};
  const levelTotals: Record<string, Record<string, number>> = {};

  for (const row of editionSummary) {
    for (const [rarity, levels] of Object.entries(row.rarity_level_counts)) {
      if (!rarityTotals[rarity]) rarityTotals[rarity] = {};
      for (const [level, foils] of Object.entries(levels)) {
        if (!levelTotals[level]) levelTotals[level] = {};
        for (const [foilName, count] of Object.entries(foils)) {
          rarityTotals[rarity][foilName] =
            (rarityTotals[rarity][foilName] ?? 0) + (count ?? 0);
          levelTotals[level][foilName] =
            (levelTotals[level][foilName] ?? 0) + (count ?? 0);
        }
      }
    }
  }

  const rarityXLabels = cardRarityOptions.filter((r) => rarityTotals[r]);

  const levelXKeys = Object.keys(levelTotals).sort(
    (a, b) => Number(a) - Number(b)
  );
  const levelXLabels = levelXKeys.map((l) => `Lv${l}`);

  if (rarityXLabels.length === 0) return null;

  const rarityTraces: Partial<Plotly.PlotData>[] = cardFoilOptions.map(
    (foilName) => ({
      type: "bar",
      name: foilName,
      x: rarityXLabels,
      y: rarityXLabels.map((r) => rarityTotals[r][foilName] ?? 0),
      marker: { color: FOIL_PLOT_COLORS[foilName] },
    })
  );

  const levelTraces: Partial<Plotly.PlotData>[] = cardFoilOptions.map(
    (foilName) => ({
      type: "bar",
      name: foilName,
      x: levelXLabels,
      y: levelXKeys.map((l) => levelTotals[l][foilName] ?? 0),
      marker: { color: FOIL_PLOT_COLORS[foilName] },
      showlegend: false,
    })
  );

  return (
    <Box
      sx={{
        mt: 3,
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        gap: 2,
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" gutterBottom>
          Cards by Rarity
        </Typography>
        <FullscreenPlotWrapper
          data={rarityTraces}
          layout={{
            barmode: "stack",
            showlegend: true,
            legend: { orientation: "h", y: -0.3 },
            margin: { t: 20, l: 50, r: 20, b: 80 },
          }}
          style={{ width: "100%", height: "300px" }}
        />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" gutterBottom>
          Cards by Level
        </Typography>
        <FullscreenPlotWrapper
          data={levelTraces}
          layout={{
            barmode: "stack",
            showlegend: false,
            margin: { t: 20, l: 50, r: 20, b: 40 },
          }}
          style={{ width: "100%", height: "300px" }}
        />
      </Box>
    </Box>
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
                <TableCell
                  align="right"
                  sx={{
                    color: FOIL_COLORS.regular,
                    display: { xs: "none", md: "table-cell" },
                  }}
                >
                  Regular
                </TableCell>
              </Tooltip>
              <Tooltip title="Gold foil (foil type 1)">
                <TableCell
                  align="right"
                  sx={{
                    color: FOIL_COLORS.gold,
                    display: { xs: "none", md: "table-cell" },
                  }}
                >
                  Gold
                </TableCell>
              </Tooltip>
              <Tooltip title="Gold Arcane foil (foil type 2)">
                <TableCell
                  align="right"
                  sx={{
                    color: FOIL_COLORS.gold_arcane,
                    display: { xs: "none", md: "table-cell" },
                  }}
                >
                  Gold Arc.
                </TableCell>
              </Tooltip>
              <Tooltip title="Black foil (foil type 3)">
                <TableCell
                  align="right"
                  sx={{
                    color: FOIL_COLORS.black,
                    display: { xs: "none", md: "table-cell" },
                  }}
                >
                  Black
                </TableCell>
              </Tooltip>
              <Tooltip title="Black Arcane foil (foil type 4)">
                <TableCell
                  align="right"
                  sx={{
                    color: FOIL_COLORS.black_arcane,
                    display: { xs: "none", md: "table-cell" },
                  }}
                >
                  Black Arc.
                </TableCell>
              </Tooltip>
              <Tooltip title="Cards owned by the player, not delegated">
                <TableCell
                  align="right"
                  sx={{ display: { xs: "none", sm: "table-cell" } }}
                >
                  Owned
                </TableCell>
              </Tooltip>
              <Tooltip title="Cards with an active rental period">
                <TableCell
                  align="right"
                  sx={{ display: { xs: "none", sm: "table-cell" } }}
                >
                  Rented
                </TableCell>
              </Tooltip>
              <Tooltip title="Cards delegated to another player">
                <TableCell
                  align="right"
                  sx={{ display: { xs: "none", sm: "table-cell" } }}
                >
                  Delegated
                </TableCell>
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

      <CardCollectionCharts editionSummary={data.editionSummary} />

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mt: 1, display: "block" }}
      >
        Click the arrow on any row to see a breakdown by rarity and level (hover
        chips for foil breakdown). Only cards actively staked on a land plot are
        included.
      </Typography>
    </Box>
  );
}
