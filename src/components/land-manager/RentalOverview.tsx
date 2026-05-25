"use client";

import { useLandManagerRegionData } from "@/hooks/useLandManagerRegionData";
import {
  landElementBgColor,
  landElementIconUrl,
  landElementLabel,
} from "@/lib/utils/cardUtil";
import { BiomeModifiers, RentalEligiblePlot } from "@/types/landManager";
import { cardElementOptions } from "@/types/planner";
import { Bolt, BoltOutlined, Cancel } from "@mui/icons-material";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";

interface Props {
  enabledRegions: number[];
  refreshKey?: number;
}

interface PlotRentSummary {
  rentedCount: number;
  decPerDay: number;
  totalDec: number;
}

function fmtDec(value: number): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: 3 });
}

function fmtInt(value: number): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

/** Remaining days from rental_date + rental_days vs now. Returns null when date is absent. */
function calcDaysRemaining(
  rentalDate: string | null,
  rentalDays: number
): number | null {
  if (!rentalDate) return null;
  const end = new Date(rentalDate).getTime() + rentalDays * 86_400_000;
  return Math.max(0, (end - Date.now()) / 86_400_000);
}

function fmtDaysRemaining(days: number | null): string {
  if (days === null) return "—";
  if (days === 0) return "Expired";
  const wholeDays = Math.floor(days);
  const hours = Math.floor((days - wholeDays) * 24);
  return wholeDays > 0
    ? hours > 0
      ? `${wholeDays}d ${hours}h`
      : `${wholeDays}d`
    : `${hours}h`;
}

function BiomeChips({ modifiers }: { modifiers: BiomeModifiers }) {
  return (
    <Stack direction="row" gap={0.5} flexWrap="wrap">
      {cardElementOptions
        .filter((key) => modifiers[key] > 0)
        .map((key) => (
          <Chip
            key={key}
            avatar={
              <Avatar
                src={landElementIconUrl[key]}
                alt={landElementLabel[key]}
                variant="rounded"
                sx={{
                  backgroundColor: landElementBgColor[key],

                  // Bigger avatar container
                  width: 20,
                  height: 20,

                  // Smaller icon inside
                  "& img": {
                    width: 12,
                    height: 12,
                    objectFit: "contain",
                  },
                }}
              />
            }
            label={`+${(modifiers[key] * 100).toFixed(0)}%`}
            size="small"
            variant="outlined"
            sx={{
              fontSize: "0.65rem",
              height: 25,
              "& .MuiChip-avatar": {
                ml: 0.25,
              },
            }}
          />
        ))}
    </Stack>
  );
}

function WorkerCount({
  workerCount,
  rentedCount,
  maxWorkers,
}: {
  workerCount: number;
  rentedCount: number;
  maxWorkers: number;
}) {
  const ownedCount = Math.max(0, workerCount - rentedCount);
  const emptyCount = Math.max(0, maxWorkers - workerCount);
  // No rentals → keep the simpler "X / max" display.
  if (rentedCount === 0) {
    return (
      <Typography variant="caption">
        {workerCount} / {maxWorkers}
      </Typography>
    );
  }
  return (
    <Tooltip
      title={`${ownedCount} owned · ${rentedCount} rented · ${emptyCount} empty`}
    >
      <Typography variant="caption">
        {ownedCount}+{rentedCount} / {maxWorkers}
      </Typography>
    </Tooltip>
  );
}

function PlotRow({
  plot,
  rentSummary,
}: {
  plot: RentalEligiblePlot;
  rentSummary: PlotRentSummary;
}) {
  return (
    <TableRow>
      <TableCell>
        <Typography variant="caption" fontFamily="monospace">
          R{plot.region_number} · T{plot.tract_number} · P{plot.plot_number}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="caption">{plot.resource_symbol ?? "—"}</Typography>
      </TableCell>
      <TableCell>
        <Stack direction="row" alignItems="center" gap={0.5}>
          {plot.is_powered ? (
            <Bolt sx={{ fontSize: 14, color: "warning.main" }} />
          ) : (
            <BoltOutlined sx={{ fontSize: 14, color: "text.disabled" }} />
          )}
          <WorkerCount
            workerCount={plot.worker_count}
            rentedCount={rentSummary.rentedCount}
            maxWorkers={plot.max_workers}
          />
        </Stack>
      </TableCell>
      <TableCell>
        <Chip
          label={`${plot.empty_slots} empty`}
          size="small"
          color="primary"
          variant="outlined"
          sx={{ fontSize: "0.65rem", height: 18 }}
        />
      </TableCell>
      <TableCell align="right">
        <Typography variant="caption">
          {rentSummary.decPerDay > 0 ? fmtDec(rentSummary.decPerDay) : "—"}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="caption">
          {rentSummary.totalDec > 0 ? fmtDec(rentSummary.totalDec) : "—"}
        </Typography>
      </TableCell>
      <TableCell>
        <BiomeChips modifiers={plot.biome_modifiers} />
      </TableCell>
    </TableRow>
  );
}

function PlotTable({
  plots,
  rentByPlot,
  emptyMessage,
}: {
  plots: RentalEligiblePlot[];
  rentByPlot: Map<number, PlotRentSummary>;
  emptyMessage: string;
}) {
  if (plots.length === 0) {
    return (
      <Typography variant="body2" color="text.disabled">
        {emptyMessage}
      </Typography>
    );
  }
  const empty: PlotRentSummary = {
    rentedCount: 0,
    decPerDay: 0,
    totalDec: 0,
  };
  return (
    <Box sx={{ overflowX: "auto" }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Plot</TableCell>
            <TableCell>Resource</TableCell>
            <TableCell>Workers</TableCell>
            <TableCell>Empty</TableCell>
            <TableCell align="right">DEC/day</TableCell>
            <TableCell align="right">Total DEC</TableCell>
            <TableCell>Biome boost</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {plots.map((p) => (
            <PlotRow
              key={p.deed_uid}
              plot={p}
              rentSummary={rentByPlot.get(p.plot_id) ?? empty}
            />
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

export default function RentalOverview({
  enabledRegions,
  refreshKey = 0,
}: Props) {
  const {
    eligibility: data,
    rentedCards,
    loading,
  } = useLandManagerRegionData(enabledRegions, refreshKey);

  const rentByPlot = useMemo(() => {
    const map = new Map<number, PlotRentSummary>();
    for (const c of rentedCards?.cards ?? []) {
      const existing = map.get(c.stake_plot) ?? {
        rentedCount: 0,
        decPerDay: 0,
        totalDec: 0,
      };
      existing.rentedCount += 1;
      existing.decPerDay += c.dec_per_day;
      existing.totalDec += c.total_dec;
      map.set(c.stake_plot, existing);
    }
    return map;
  }, [rentedCards]);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  if (enabledRegions.length === 0) return null;

  if (loading || data === null) {
    return (
      <Box sx={{ mb: 2 }}>
        <Skeleton variant="rounded" height={120} />
      </Box>
    );
  }

  const totalEmptyEligible = data.eligible.reduce(
    (sum, p) => sum + p.empty_slots,
    0
  );
  const totalEmptyUnpowered = data.unpoweredSkipped.reduce(
    (sum, p) => sum + p.empty_slots,
    0
  );

  const hasRented = (rentedCards?.cards.length ?? 0) > 0;
  if (
    data.eligible.length === 0 &&
    data.unpoweredSkipped.length === 0 &&
    !hasRented
  ) {
    return null;
  }

  const cards = rentedCards?.cards ?? [];
  const paginated = cards.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Typography variant="subtitle2" gutterBottom>
          Rental Overview
        </Typography>

        {hasRented && rentedCards && (
          <Stack direction="row" gap={1} flexWrap="wrap" mb={2}>
            <Chip
              label={`Rented cards: ${rentedCards.cards.length}`}
              size="small"
              variant="outlined"
              color="info"
            />
            <Chip
              label={`${fmtDec(rentedCards.total_dec_per_day)} DEC/day`}
              size="small"
              variant="outlined"
              color="info"
            />
            <Chip
              label={`${fmtInt(rentedCards.total_dec_for_duration)} DEC total spend`}
              size="small"
              variant="outlined"
              color="info"
            />
          </Stack>
        )}

        <Stack gap={2}>
          <Box>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Eligible plots — powered with empty worker slots ·{" "}
              {data.eligible.length} plot
              {data.eligible.length === 1 ? "" : "s"} · {totalEmptyEligible}{" "}
              empty slot{totalEmptyEligible === 1 ? "" : "s"}
            </Typography>
            <PlotTable
              plots={data.eligible}
              rentByPlot={rentByPlot}
              emptyMessage="No plots with empty worker slots"
            />
          </Box>

          {data.unpoweredSkipped.length > 0 && (
            <Box>
              <Typography variant="caption" color="warning.main" gutterBottom>
                Unpowered plots — skipped · {data.unpoweredSkipped.length} plot
                {data.unpoweredSkipped.length === 1 ? "" : "s"} ·{" "}
                {totalEmptyUnpowered} empty slot
                {totalEmptyUnpowered === 1 ? "" : "s"} (power these to make them
                eligible)
              </Typography>
              <PlotTable
                plots={data.unpoweredSkipped}
                rentByPlot={rentByPlot}
                emptyMessage="No unpowered plots"
              />
            </Box>
          )}

          {hasRented && (
            <Box>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Rented cards — {cards.length} card
                {cards.length === 1 ? "" : "s"} rented from other players,
                staked on your plots.
              </Typography>
              <Box sx={{ overflowX: "auto" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Card UID</TableCell>
                      <TableCell>Owner</TableCell>
                      <TableCell>Plot</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell align="right">Days left</TableCell>
                      <TableCell align="right">DEC/day</TableCell>
                      <TableCell align="right">Total DEC</TableCell>
                      <TableCell align="center">Cancelled</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginated.map((c) => (
                      <TableRow key={c.card_uid}>
                        <TableCell>
                          <Typography variant="caption" fontFamily="monospace">
                            {c.card_uid}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">{c.owner}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" fontFamily="monospace">
                            {c.stake_region != null
                              ? `R${c.stake_region} · `
                              : ""}
                            #{c.stake_plot}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {c.rental_type}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="caption">
                            {fmtDaysRemaining(
                              calcDaysRemaining(c.rental_date, c.rental_days)
                            )}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="caption">
                            {fmtDec(c.dec_per_day)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="caption">
                            {fmtDec(c.total_dec)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {c.cancel_tx && (
                            <Tooltip title="Cancellation pending">
                              <Cancel fontSize="small" color="error" />
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
              <TablePagination
                component="div"
                count={cards.length}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[5, 10, 25, 50]}
              />
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
