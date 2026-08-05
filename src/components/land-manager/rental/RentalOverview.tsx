"use client";

import ScrollableTableContainer from "@/components/ui/ScrollableTableContainer";
import { useCancelRentalAction } from "@/hooks/useCancelRentalAction";
import { useRentedCardsList } from "@/hooks/useRentedCardsList";
import { useUnstakeWorkerAction } from "@/hooks/useUnstakeWorkerAction";
import { type RentedCardEntry } from "@/lib/backend/actions/land-manager/rental-actions";
import { Cancel, LinkOff, RemoveCircleOutline } from "@mui/icons-material";
import {
  Alert,
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
import { useCallback, useMemo, useState } from "react";

interface Props {
  username: string;
  refreshKey?: number;
  onSuccess?: () => void;
}

type RentedSortField = "daysLeft" | "decPerDay" | "totalDec" | "base_pp";

function fmtDec(value: number): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: 3 });
}

function fmtInt(value: number): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function calcDaysRemaining(
  rentalDate: string | null,
  rentalDays: number
): number | null {
  if (!rentalDate) return null;
  const end = new Date(rentalDate).getTime() + rentalDays * 86_400_000;
  return Math.max(0, (end - Date.now()) / 86_400_000);
}

function fmtDaysRemaining(days: number | null): string {
  if (days === null) return "-";
  if (days === 0) return "Expired";
  const wholeDays = Math.floor(days);
  const hours = Math.floor((days - wholeDays) * 24);
  return wholeDays > 0
    ? hours > 0
      ? `${wholeDays}d ${hours}h`
      : `${wholeDays}d`
    : `${hours}h`;
}

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

type FilterColumn = {
  value: string;
  setter: ((v: string) => void) | null;
  placeholder: string;
  type: "text" | "number" | "none";
  align?: "left" | "right" | "center";
};

export default function RentalOverview({
  username,
  refreshKey = 0,
  onSuccess,
}: Props) {
  const [internalRefreshKey, setInternalRefreshKey] = useState(0);
  const refreshToken = `${refreshKey}:${internalRefreshKey}`;
  const { data, loading, error } = useRentedCardsList(refreshToken);

  const allCards = useMemo(() => data?.cards ?? [], [data?.cards]);

  const [rentedPage, setRentedPage] = useState(0);
  const [rentedRowsPerPage, setRentedRowsPerPage] = useState(10);

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

  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const cancelAction = useCancelRentalAction({
    username,
    onSuccess: () => {
      setCancelTarget(null);
      setInternalRefreshKey((k) => k + 1);
      onSuccess?.();
    },
  });

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

  if (loading || data === null) {
    return (
      <Box sx={{ mb: 2 }}>
        <Skeleton variant="rounded" height={120} />
      </Box>
    );
  }

  if (error && data === null) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  const filterColumns: FilterColumn[] = [
    {
      value: fCardUid,
      setter: setFCardUid,
      placeholder: "UID...",
      type: "text",
    },
    {
      value: fOwner,
      setter: setFOwner,
      placeholder: "Owner...",
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
      placeholder: "Type...",
      type: "text",
    },
    {
      value: fMinDays,
      setter: setFMinDays,
      placeholder: ">= days",
      type: "number",
      align: "right",
    },
    {
      value: fMinBasePP,
      setter: setFMinBasePP,
      placeholder: ">= PP",
      type: "number",
      align: "right",
    },
    {
      value: fMinDecDay,
      setter: setFMinDecDay,
      placeholder: ">= DEC",
      type: "number",
      align: "right",
    },
    {
      value: fMinTotalDec,
      setter: setFMinTotalDec,
      placeholder: ">= DEC",
      type: "number",
      align: "right",
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
  ];

  return (
    <>
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
            harvest. If you do not have enough Grain, you will forfeit your
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

      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
          <Typography variant="subtitle2" gutterBottom>
            Rental Overview
          </Typography>

          <Stack direction="row" gap={1} flexWrap="wrap" mb={2}>
            <Chip
              label={`Rented cards: ${data.cards.length}`}
              size="small"
              variant="outlined"
              color="info"
            />
            <Chip
              label={`${fmtDec(data.total_dec_per_day)} DEC/day`}
              size="small"
              variant="outlined"
              color="info"
            />
            <Chip
              label={`${fmtInt(data.total_dec_for_duration)} DEC total spend`}
              size="small"
              variant="outlined"
              color="info"
            />
          </Stack>

          <Typography variant="caption" color="text.secondary" gutterBottom>
            Currently rented cards staked on your plots.
          </Typography>

          <ScrollableTableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Card UID</TableCell>
                  <TableCell>Owner</TableCell>
                  <TableCell>Plot</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={rentedSortField === "daysLeft"}
                      direction={
                        rentedSortField === "daysLeft" ? rentedSortDir : "desc"
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
                        rentedSortField === "base_pp" ? rentedSortDir : "desc"
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
                        rentedSortField === "decPerDay" ? rentedSortDir : "desc"
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
                        rentedSortField === "totalDec" ? rentedSortDir : "desc"
                      }
                      onClick={() => handleRentedSort("totalDec")}
                    >
                      Total DEC
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="center">Cancelled</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
                <TableRow>
                  {filterColumns.map((col, i) => (
                    <TableCell
                      key={i}
                      align={col.align ?? "left"}
                      sx={{ py: 0.5, px: 1 }}
                    >
                      {col.setter ? (
                        <TextField
                          size="small"
                          type={col.type}
                          placeholder={col.placeholder}
                          value={col.value}
                          onChange={(e) => {
                            (col.setter as (v: string) => void)(e.target.value);
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
                {rentedPaginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center">
                      <Typography color="text.secondary" sx={{ py: 3 }}>
                        No rented workers found for this account.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  rentedPaginated.map((c) => (
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
                                ? "No market listing ID - cannot cancel"
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
                                  <RemoveCircleOutline sx={{ fontSize: 13 }} />
                                }
                                sx={{ fontSize: "0.65rem", py: 0.25 }}
                                onClick={() =>
                                  c.market_id && setCancelTarget(c.market_id)
                                }
                              >
                                Cancel
                              </Button>
                            </span>
                          </Tooltip>
                          <Tooltip
                            title={
                              !c.deed_uid
                                ? "No deed UID - cannot unstake"
                                : c.stake_end_date != null
                                  ? "Already unstaked - cannot unstake again"
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
                                  c.stake_end_date != null ||
                                  cancelAction.busy ||
                                  unstakeAction.busy
                                }
                                startIcon={<LinkOff sx={{ fontSize: 13 }} />}
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
                  ))
                )}
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
        </CardContent>
      </Card>
    </>
  );
}
