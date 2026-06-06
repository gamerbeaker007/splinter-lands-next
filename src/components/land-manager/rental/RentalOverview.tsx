"use client";

import StakePowerCoreButton from "@/components/land-manager/rental/StakePowerCoreButton";
import ScrollableTableContainer from "@/components/ui/ScrollableTableContainer";
import { useCancelRentalAction } from "@/hooks/useCancelRentalAction";
import { useLandManagerRegionData } from "@/hooks/useLandManagerRegionData";
import { useUnstakeWorkerAction } from "@/hooks/useUnstakeWorkerAction";
import type { RentedCardEntry } from "@/lib/backend/actions/land-manager/rental-actions";
import { filterDeeds, parseLandStatsResources } from "@/lib/filters";
import { useFilters } from "@/lib/frontend/context/FilterContext";
import {
  BiomeModifiers,
  landElementBgColor,
  landElementIconUrl,
  landElementLabel,
} from "@/lib/utils/cardUtil";
import { RentalEligiblePlot } from "@/types/landManager";
import { cardElementOptions } from "@/types/planner";
import {
  Bolt,
  BoltOutlined,
  Cancel,
  LinkOff,
  RemoveCircleOutline,
} from "@mui/icons-material";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Skeleton,
  Stack,
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
import { useCallback, useEffect, useMemo, useState } from "react";

interface Props {
  username: string;
  enabledRegions: number[];
  refreshKey?: number;
  onSuccess?: () => void;
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
  action,
}: {
  plot: RentalEligiblePlot;
  rentSummary: PlotRentSummary;
  action?: React.ReactNode;
}) {
  return (
    <TableRow>
      <TableCell>
        <Typography variant="caption" fontFamily="monospace">
          R{plot.region_number} · T{plot.tract_number} · P{plot.plot_number}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="caption">
          {parseLandStatsResources(plot.land_stats)[0] ?? "—"}
        </Typography>
      </TableCell>

      <TableCell>
        <Typography variant="caption">{plot.worksite_type ?? "—"}</Typography>
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
      {action !== undefined && <TableCell>{action}</TableCell>}
    </TableRow>
  );
}

const PLOT_TABLE_ROWS_PER_PAGE_OPTIONS = [5, 10, 25, 50];

function PlotTable({
  plots,
  rentByPlot,
  emptyMessage,
  renderAction,
}: {
  plots: RentalEligiblePlot[];
  rentByPlot: Map<number, PlotRentSummary>;
  emptyMessage: string;
  renderAction?: (plot: RentalEligiblePlot) => React.ReactNode;
}) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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
  const paginated = plots.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  return (
    <>
      <ScrollableTableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Plot</TableCell>
              <TableCell>Resource</TableCell>
              <TableCell>Worksite</TableCell>
              <TableCell>Workers</TableCell>
              <TableCell>Empty</TableCell>
              <TableCell align="right">DEC/day</TableCell>
              <TableCell align="right">Total DEC</TableCell>
              <TableCell>Biome boost</TableCell>
              {renderAction && <TableCell>Action</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.map((p) => (
              <PlotRow
                key={p.deed_uid}
                plot={p}
                rentSummary={rentByPlot.get(p.plot_id) ?? empty}
                action={renderAction?.(p)}
              />
            ))}
          </TableBody>
        </Table>
      </ScrollableTableContainer>
      <TablePagination
        component="div"
        count={plots.length}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={PLOT_TABLE_ROWS_PER_PAGE_OPTIONS}
      />
    </>
  );
}

// ── Rented-cards sort / filter types ────────────────────────────────────────

type RentedSortField = "daysLeft" | "decPerDay" | "totalDec" | "base_pp";

function sortRentedCards(
  cards: RentedCardEntry[],
  field: RentedSortField,
  dir: "asc" | "desc"
): RentedCardEntry[] {
  const sign = dir === "asc" ? 1 : -1;
  return [...cards].sort((a, b) => {
    switch (field) {
      case "daysLeft": {
        const da = calcDaysRemaining(a.rental_date, a.rental_days) ?? -1;
        const db = calcDaysRemaining(b.rental_date, b.rental_days) ?? -1;
        return sign * (da - db);
      }
      case "decPerDay":
        return sign * (a.dec_per_day - b.dec_per_day);
      case "totalDec":
        return sign * (a.total_dec - b.total_dec);
      case "base_pp":
        return sign * (a.base_pp - b.base_pp);
    }
  });
}

// ── Main component ───────────────────────────────────────────────────────────

export default function RentalOverview({
  username,
  enabledRegions,
  refreshKey = 0,
  onSuccess,
}: Props) {
  const [internalRefreshKey, setInternalRefreshKey] = useState(0);
  const combinedRefreshKey = refreshKey + internalRefreshKey;
  const {
    eligibility: data,
    rentedCards,
    loading,
  } = useLandManagerRegionData(enabledRegions, combinedRefreshKey);

  const handleStakeSuccess = useCallback(() => {
    setInternalRefreshKey((k) => k + 1);
    onSuccess?.();
  }, [onSuccess]);

  const { filters, setLocationOverride } = useFilters();

  // Push live region/tract/plot lists into the FilterDrawer so the location
  // filter reflects this player's plots (rather than the global DB cache).
  useEffect(() => {
    if (!data) return;
    const regions = new Set<number>();
    const tracts = new Set<number>();
    const plots = new Set<number>();
    for (const p of [...data.eligible, ...data.unpoweredSkipped]) {
      regions.add(p.region_number);
      tracts.add(p.tract_number);
      plots.add(p.plot_number);
    }
    setLocationOverride({
      filter_regions: [...regions].sort((a, b) => a - b),
      filter_tracts: [...tracts].sort((a, b) => a - b),
      filter_plots: [...plots].sort((a, b) => a - b),
    });
  }, [data, setLocationOverride]);

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

  // ── Rented cards table: sort / filter / pagination ───────────────────────

  const [rentedPage, setRentedPage] = useState(0);
  const [rentedRowsPerPage, setRentedRowsPerPage] = useState(10);
  // Per-column filters
  const [fCardUid, setFCardUid] = useState("");
  const [fOwner, setFOwner] = useState("");
  const [fType, setFType] = useState("");
  const [fMinDays, setFMinDays] = useState("");
  const [fMinBasePP, setFMinBasePP] = useState("");
  const [fMinDecDay, setFMinDecDay] = useState("");
  const [fMinTotalDec, setFMinTotalDec] = useState("");

  const resetRentedPage = useCallback(() => setRentedPage(0), []);

  const [rentedSortField, setRentedSortField] =
    useState<RentedSortField>("totalDec");
  const [rentedSortDir, setRentedSortDir] = useState<"asc" | "desc">("desc");

  const handleRentedSort = useCallback(
    (field: RentedSortField) => {
      if (field === rentedSortField) {
        setRentedSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setRentedSortField(field);
        setRentedSortDir("desc");
      }
      setRentedPage(0);
    },
    [rentedSortField]
  );

  const allCards = useMemo(
    () => rentedCards?.cards ?? [],
    [rentedCards?.cards]
  );

  const filteredSortedCards = useMemo(() => {
    const minDays = parseFloat(fMinDays);
    const minBasePP = parseFloat(fMinBasePP);
    const minDecDay = parseFloat(fMinDecDay);
    const minTotalDec = parseFloat(fMinTotalDec);
    const cardUidLow = fCardUid.trim().toLowerCase();
    const ownerLow = fOwner.trim().toLowerCase();
    const typeLow = fType.trim().toLowerCase();
    const filtered = allCards.filter((c) => {
      if (cardUidLow && !c.card_uid.toLowerCase().includes(cardUidLow))
        return false;
      if (ownerLow && !c.owner.toLowerCase().includes(ownerLow)) return false;
      if (typeLow && !c.rental_type.toLowerCase().includes(typeLow))
        return false;
      if (!isNaN(minDays)) {
        const days = calcDaysRemaining(c.rental_date, c.rental_days) ?? 0;
        if (days < minDays) return false;
      }
      if (!isNaN(minBasePP) && c.base_pp < minBasePP) return false;
      if (!isNaN(minDecDay) && c.dec_per_day < minDecDay) return false;
      if (!isNaN(minTotalDec) && c.total_dec < minTotalDec) return false;
      return true;
    });
    return sortRentedCards(filtered, rentedSortField, rentedSortDir);
  }, [
    allCards,
    fCardUid,
    fOwner,
    fType,
    fMinDays,
    fMinBasePP,
    fMinDecDay,
    fMinTotalDec,
    rentedSortField,
    rentedSortDir,
  ]);

  const rentedPaginated = filteredSortedCards.slice(
    rentedPage * rentedRowsPerPage,
    rentedPage * rentedRowsPerPage + rentedRowsPerPage
  );

  // ── Cancel rental action ─────────────────────────────────────────────────

  const [cancelTarget, setCancelTarget] = useState<string | null>(null); // marketId
  const cancelAction = useCancelRentalAction({
    username,
    onSuccess: () => {
      setCancelTarget(null);
      setInternalRefreshKey((k) => k + 1);
      onSuccess?.();
    },
  });

  // ── Unstake action ───────────────────────────────────────────────────────

  const [unstakeTarget, setUnstakeTarget] = useState<{
    cardUid: string;
    deedUid: string;
  } | null>(null);
  const unstakeAction = useUnstakeWorkerAction({
    username,
    onSuccess: () => {
      setUnstakeTarget(null);
      setInternalRefreshKey((k) => k + 1);
      onSuccess?.();
    },
  });

  // ── Misc ─────────────────────────────────────────────────────────────────

  const filteredEligible = useMemo(
    () => filterDeeds(data?.eligible ?? [], filters),
    [data?.eligible, filters]
  );
  const filteredUnpowered = useMemo(
    () => filterDeeds(data?.unpoweredSkipped ?? [], filters),
    [data?.unpoweredSkipped, filters]
  );

  if (enabledRegions.length === 0) return null;

  if (loading || data === null) {
    return (
      <Box sx={{ mb: 2 }}>
        <Skeleton variant="rounded" height={120} />
      </Box>
    );
  }

  const hasRented = allCards.length > 0;
  if (
    data.eligible.length === 0 &&
    data.unpoweredSkipped.length === 0 &&
    !hasRented
  ) {
    return null;
  }

  return (
    <>
      {/* ── Cancel rental confirm dialog ─────────────────────────────── */}
      <Dialog
        open={cancelTarget !== null}
        onClose={() => {
          if (!cancelAction.busy) setCancelTarget(null);
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Cancel rental?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            This will queue a cancellation for the selected rental. The rental
            will not be renewed at the end of the current period.
          </Typography>
          {cancelAction.error && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {cancelAction.error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              cancelAction.clearError();
              setCancelTarget(null);
            }}
            disabled={cancelAction.busy}
          >
            Back
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={cancelAction.busy}
            startIcon={
              cancelAction.busy ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <RemoveCircleOutline />
              )
            }
            onClick={() => {
              if (cancelTarget) cancelAction.execute(cancelTarget);
            }}
          >
            Cancel rental
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Unstake confirm dialog ───────────────────────────────────── */}
      <Dialog
        open={unstakeTarget !== null}
        onClose={() => {
          if (!unstakeAction.busy) {
            setUnstakeTarget(null);
            unstakeAction.clearError();
          }
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Remove from land?</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 1.5 }}>
            Changing production on an active plot will automatically trigger a
            harvest. If you don&apos;t have enough Grain, you will forfeit your
            entire harvest. Do you still want to proceed?
          </Alert>
          <Typography variant="body2">
            The worker card will be unstaked from the deed.
          </Typography>
          {unstakeAction.error && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {unstakeAction.error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              unstakeAction.clearError();
              setUnstakeTarget(null);
            }}
            disabled={unstakeAction.busy}
          >
            Back
          </Button>
          <Button
            variant="contained"
            color="warning"
            disabled={unstakeAction.busy}
            startIcon={
              unstakeAction.busy ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <LinkOff />
              )
            }
            onClick={() => {
              if (unstakeTarget)
                unstakeAction.execute(
                  unstakeTarget.cardUid,
                  unstakeTarget.deedUid
                );
            }}
          >
            Unstake from land
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Main card ───────────────────────────────────────────────── */}
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
                {filteredEligible.length} plot
                {filteredEligible.length === 1 ? "" : "s"} ·{" "}
                {filteredEligible.reduce((sum, p) => sum + p.empty_slots, 0)}{" "}
                empty slot
                {filteredEligible.reduce((sum, p) => sum + p.empty_slots, 0) ===
                1
                  ? ""
                  : "s"}
              </Typography>
              <PlotTable
                plots={filteredEligible}
                rentByPlot={rentByPlot}
                emptyMessage="No plots with empty worker slots"
              />
            </Box>

            {data.unpoweredSkipped.length > 0 && (
              <Box>
                <Typography variant="caption" color="warning.main" gutterBottom>
                  Unpowered plots — skipped · {filteredUnpowered.length} plot
                  {filteredUnpowered.length === 1 ? "" : "s"} ·{" "}
                  {filteredUnpowered.reduce((sum, p) => sum + p.empty_slots, 0)}{" "}
                  empty slot
                  {filteredUnpowered.reduce(
                    (sum, p) => sum + p.empty_slots,
                    0
                  ) === 1
                    ? ""
                    : "s"}{" "}
                  (power these to make them eligible)
                </Typography>
                <PlotTable
                  plots={filteredUnpowered}
                  rentByPlot={rentByPlot}
                  emptyMessage="No unpowered plots"
                  renderAction={(plot) => (
                    <StakePowerCoreButton
                      username={username}
                      plot={plot}
                      onSuccess={handleStakeSuccess}
                    />
                  )}
                />
              </Box>
            )}

            {hasRented && (
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  gutterBottom
                >
                  Rented cards — {allCards.length} card
                  {allCards.length === 1 ? "" : "s"} rented from other players,
                  staked on your plots.
                </Typography>

                <ScrollableTableContainer>
                  <Table size="small">
                    <TableHead>
                      {/* ── Label + sort row ── */}
                      <TableRow>
                        <TableCell>Card UID</TableCell>
                        <TableCell>Owner</TableCell>
                        <TableCell>Plot</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell align="right">
                          <TableSortLabel
                            active={rentedSortField === "daysLeft"}
                            direction={
                              rentedSortField === "daysLeft"
                                ? rentedSortDir
                                : "desc"
                            }
                            onClick={() => handleRentedSort("daysLeft")}
                          >
                            Days left
                          </TableSortLabel>
                        </TableCell>
                        <TableCell align="right">
                          <TableSortLabel
                            active={rentedSortField === "base_pp"}
                            direction={
                              rentedSortField === "base_pp"
                                ? rentedSortDir
                                : "desc"
                            }
                            onClick={() => handleRentedSort("base_pp")}
                          >
                            Base PP
                          </TableSortLabel>
                        </TableCell>
                        <TableCell align="right">
                          <TableSortLabel
                            active={rentedSortField === "decPerDay"}
                            direction={
                              rentedSortField === "decPerDay"
                                ? rentedSortDir
                                : "desc"
                            }
                            onClick={() => handleRentedSort("decPerDay")}
                          >
                            DEC/day
                          </TableSortLabel>
                        </TableCell>
                        <TableCell align="right">
                          <TableSortLabel
                            active={rentedSortField === "totalDec"}
                            direction={
                              rentedSortField === "totalDec"
                                ? rentedSortDir
                                : "desc"
                            }
                            onClick={() => handleRentedSort("totalDec")}
                          >
                            Total DEC
                          </TableSortLabel>
                        </TableCell>
                        <TableCell align="center">Cancelled</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                      {/* ── Per-column filter row ── */}
                      <TableRow>
                        {(
                          [
                            {
                              value: fCardUid,
                              setter: setFCardUid,
                              placeholder: "UID…",
                              type: "text",
                            },
                            {
                              value: fOwner,
                              setter: setFOwner,
                              placeholder: "Owner…",
                              type: "text",
                            },
                            {
                              value: "",
                              setter: null,
                              placeholder: "",
                              type: "none",
                            },
                            {
                              value: fType,
                              setter: setFType,
                              placeholder: "Type…",
                              type: "text",
                            },
                            {
                              value: fMinDays,
                              setter: setFMinDays,
                              placeholder: "≥ days",
                              type: "number",
                            },
                            {
                              value: fMinBasePP,
                              setter: setFMinBasePP,
                              placeholder: "≥ PP",
                              type: "number",
                            },
                            {
                              value: fMinDecDay,
                              setter: setFMinDecDay,
                              placeholder: "≥ DEC",
                              type: "number",
                            },
                            {
                              value: fMinTotalDec,
                              setter: setFMinTotalDec,
                              placeholder: "≥ DEC",
                              type: "number",
                            },
                            {
                              value: "",
                              setter: null,
                              placeholder: "",
                              type: "none",
                            },
                            {
                              value: "",
                              setter: null,
                              placeholder: "",
                              type: "none",
                            },
                          ] as const
                        ).map((col, i) => (
                          <TableCell key={i} sx={{ py: 0.5, px: 1 }}>
                            {col.setter ? (
                              <TextField
                                size="small"
                                type={col.type}
                                placeholder={col.placeholder}
                                value={col.value}
                                onChange={(e) => {
                                  (col.setter as (v: string) => void)(
                                    e.target.value
                                  );
                                  resetRentedPage();
                                }}
                                slotProps={{
                                  htmlInput:
                                    col.type === "number"
                                      ? { min: 0, step: "any" }
                                      : {},
                                }}
                                sx={{
                                  width: col.type === "number" ? 72 : 100,
                                  "& .MuiInputBase-input": {
                                    fontSize: "0.7rem",
                                    py: 0.5,
                                    px: 0.75,
                                  },
                                }}
                              />
                            ) : null}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rentedPaginated.map((c) => (
                        <TableRow key={c.card_uid}>
                          <TableCell>
                            <Typography
                              variant="caption"
                              fontFamily="monospace"
                            >
                              {c.card_uid}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption">{c.owner}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="caption"
                              fontFamily="monospace"
                            >
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
                              {fmtInt(c.base_pp)}
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
                          <TableCell>
                            <Stack direction="row" gap={0.5}>
                              <Tooltip
                                title={
                                  !c.market_id
                                    ? "No market listing ID — cannot cancel"
                                    : c.cancel_tx
                                      ? "Cancellation already queued"
                                      : "Cancel rental renewal"
                                }
                              >
                                <span>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    disabled={
                                      !c.market_id ||
                                      !!c.cancel_tx ||
                                      cancelAction.busy ||
                                      unstakeAction.busy
                                    }
                                    startIcon={
                                      <RemoveCircleOutline
                                        sx={{ fontSize: 13 }}
                                      />
                                    }
                                    sx={{ fontSize: "0.65rem", py: 0.25 }}
                                    onClick={() =>
                                      c.market_id &&
                                      setCancelTarget(c.market_id)
                                    }
                                  >
                                    Cancel
                                  </Button>
                                </span>
                              </Tooltip>
                              <Tooltip
                                title={
                                  !c.deed_uid
                                    ? "No deed UID — cannot unstake"
                                    : "Remove card from land (unstake)"
                                }
                              >
                                <span>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="warning"
                                    disabled={
                                      !c.deed_uid ||
                                      cancelAction.busy ||
                                      unstakeAction.busy
                                    }
                                    startIcon={
                                      <LinkOff sx={{ fontSize: 13 }} />
                                    }
                                    sx={{ fontSize: "0.65rem", py: 0.25 }}
                                    onClick={() =>
                                      c.deed_uid &&
                                      setUnstakeTarget({
                                        cardUid: c.card_uid,
                                        deedUid: c.deed_uid,
                                      })
                                    }
                                  >
                                    Unstake
                                  </Button>
                                </span>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollableTableContainer>
                <TablePagination
                  component="div"
                  count={filteredSortedCards.length}
                  page={rentedPage}
                  onPageChange={(_, newPage) => setRentedPage(newPage)}
                  rowsPerPage={rentedRowsPerPage}
                  onRowsPerPageChange={(e) => {
                    setRentedRowsPerPage(parseInt(e.target.value, 10));
                    setRentedPage(0);
                  }}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                />
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>
    </>
  );
}
