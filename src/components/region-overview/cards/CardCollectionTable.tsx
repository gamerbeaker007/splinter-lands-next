"use client";

import { LandCardSetSummary } from "@/lib/backend/actions/region/land-card-collection-actions";
import { formatLargeNumber } from "@/lib/formatters";
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
  Box,
  Chip,
  Collapse,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState } from "react";

const FOIL_COLORS = {
  regular: "#aaa",
  gold: "#fdd835",
  gold_arcane: "#ffb300",
  black: "#0e1717",
  black_arcane: "#320067",
} as const;

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
        <TableCell align="right">
          {formatLargeNumber(row.land_base_pp)}
        </TableCell>
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

export function CardCollectionTable({
  editionSummary,
}: Readonly<{ editionSummary: LandCardSetSummary[] }>) {
  return (
    <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 3 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell />
            <TableCell>Card Set</TableCell>
            <Tooltip title="Total cards currently staked on land plots">
              <TableCell align="right">Total</TableCell>
            </Tooltip>
            <Tooltip title="Total Land Base PP">
              <TableCell align="right">Land Base PP</TableCell>
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
          {editionSummary.map((row) => (
            <CardSetRow key={row.card_set} row={row} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
