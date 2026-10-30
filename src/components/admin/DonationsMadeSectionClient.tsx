"use client";

import {
  getDonationsPaidByDay,
  type DonationsPaidPage,
} from "@/lib/backend/actions/land-manager/log-actions";
import { formatCompactNumber, formatNumber } from "@/lib/formatters";
import {
  Card,
  CardContent,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState, useTransition } from "react";

/** Splinterlands charges 10 % on every resource transfer — the recipient receives 90 %. */
const TRANSPORT_FEE = 0.1;
const ROWS_PER_PAGE = 10;

export default function DonationsMadeSectionClient({
  initialData,
}: {
  initialData: DonationsPaidPage;
}) {
  const [data, setData] = useState(initialData);
  const [page, setPage] = useState(0);
  const [isPending, startTransition] = useTransition();
  const symbols = Object.keys(data.allTimeTotals).sort();

  function load(nextPage: number) {
    startTransition(async () => {
      const result = await getDonationsPaidByDay(nextPage + 1, ROWS_PER_PAGE);
      setData(result);
      setPage(nextPage);
    });
  }

  return (
    <Card sx={{ mt: 4 }}>
      <CardContent>
        <Tooltip
          title="All-time totals and daily donation records. Amounts shown are what was received after the 10 % Splinterlands resource-transfer fee."
          placement="top-start"
        >
          <Typography
            variant="h6"
            gutterBottom
            sx={{
              cursor: "help",
              textDecoration: "underline dotted",
              textUnderlineOffset: 3,
            }}
          >
            Land-Operation Donations Made
          </Typography>
        </Tooltip>

        {symbols.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No donations made yet.
          </Typography>
        ) : (
          <Stack spacing={2}>
            <Stack direction="row" flexWrap="wrap" columnGap={2} rowGap={0.5}>
              <Typography variant="subtitle2">
                All-time resources received:
              </Typography>
              {symbols.map((symbol) => (
                <Typography
                  key={symbol}
                  variant="body2"
                  sx={{ fontFamily: "monospace" }}
                >
                  {symbol}{" "}
                  {formatCompactNumber(
                    data.allTimeTotals[symbol] * (1 - TRANSPORT_FEE)
                  )}
                </Typography>
              ))}
            </Stack>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    {symbols.map((symbol) => (
                      <TableCell key={symbol} align="right">
                        {symbol}
                      </TableCell>
                    ))}
                    <TableCell>Contributors</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.rows.map((row) => (
                    <TableRow key={row.date}>
                      <TableCell sx={{ fontFamily: "monospace" }}>
                        {row.date}
                      </TableCell>
                      {symbols.map((symbol) => {
                        const received =
                          (row.totals[symbol] ?? 0) * (1 - TRANSPORT_FEE);
                        return (
                          <TableCell
                            key={symbol}
                            align="right"
                            sx={{
                              fontFamily: "monospace",
                              color:
                                received > 0 ? "text.primary" : "text.disabled",
                            }}
                          >
                            {received > 0 ? formatNumber(received) : "—"}
                          </TableCell>
                        );
                      })}
                      <TableCell>
                        <Typography
                          variant="caption"
                          sx={{ fontFamily: "monospace" }}
                        >
                          {row.contributors.join(", ")}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={data.totalDays}
              page={page}
              rowsPerPage={ROWS_PER_PAGE}
              onPageChange={(_, nextPage) => load(nextPage)}
              rowsPerPageOptions={[ROWS_PER_PAGE]}
              disabled={isPending}
            />
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
