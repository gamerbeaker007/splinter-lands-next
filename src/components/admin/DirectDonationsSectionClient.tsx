"use client";

import {
  getSupportDonationsPage,
  type SupportDonationPage,
  type SupportDonationSortBy,
  type SupportDonationSortDirection,
} from "@/lib/backend/actions/support/support-actions";
import { formatNumber } from "@/lib/formatters";
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
  TableSortLabel,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useState, useTransition } from "react";

type Column = {
  key: SupportDonationSortBy;
  label: string;
  align?: "left" | "right";
};

const columns: Column[] = [
  { key: "created_at", label: "Date", align: "left" },
  { key: "username", label: "From", align: "left" },
  { key: "currency", label: "Symbol", align: "left" },
  { key: "amount", label: "Amount", align: "right" },
  { key: "usd_value", label: "USD", align: "right" },
];

export default function DirectDonationsSectionClient({
  initialData,
}: {
  initialData: SupportDonationPage;
}) {
  const [data, setData] = useState<SupportDonationPage>(initialData);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<SupportDonationSortBy>("created_at");
  const [sortDirection, setSortDirection] =
    useState<SupportDonationSortDirection>("desc");
  const [isPending, startTransition] = useTransition();

  const load = useCallback(
    (
      nextPage: number,
      nextRowsPerPage: number,
      nextSortBy: SupportDonationSortBy,
      nextSortDirection: SupportDonationSortDirection
    ) => {
      startTransition(async () => {
        const result = await getSupportDonationsPage(
          nextPage + 1,
          nextRowsPerPage,
          nextSortBy,
          nextSortDirection
        );
        setData(result);
        setPage(nextPage);
        setRowsPerPage(nextRowsPerPage);
        setSortBy(nextSortBy);
        setSortDirection(nextSortDirection);
      });
    },
    []
  );

  const onSort = (column: SupportDonationSortBy) => {
    const isSame = sortBy === column;
    const nextDirection: SupportDonationSortDirection =
      isSame && sortDirection === "asc" ? "desc" : "asc";
    load(0, rowsPerPage, column, nextDirection);
  };

  return (
    <Card sx={{ mt: 4 }}>
      <CardContent>
        <Tooltip
          title="Direct support donations (#sym:SupportDonation). These are separate from land-operation donations paid during harvest flows."
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
            Direct Donations
          </Typography>
        </Tooltip>

        {data.total === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No direct donations recorded yet.
          </Typography>
        ) : (
          <Stack spacing={2}>
            <Typography variant="caption" color="text.secondary">
              {data.total} donation{data.total !== 1 ? "s" : ""}
            </Typography>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {columns.map((column) => (
                      <TableCell
                        key={column.key}
                        align={column.align ?? "left"}
                        sortDirection={
                          sortBy === column.key ? sortDirection : false
                        }
                      >
                        <TableSortLabel
                          active={sortBy === column.key}
                          direction={
                            sortBy === column.key ? sortDirection : "asc"
                          }
                          onClick={() => onSort(column.key)}
                        >
                          {column.label}
                        </TableSortLabel>
                      </TableCell>
                    ))}
                    <TableCell>Transaction</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.rows.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ fontFamily: "monospace" }}>
                        {new Date(row.created_at).toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          hour12: false,
                        })}
                      </TableCell>
                      <TableCell sx={{ fontFamily: "monospace" }}>
                        {row.username}
                      </TableCell>
                      <TableCell sx={{ fontFamily: "monospace" }}>
                        {row.currency}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: "monospace" }}>
                        {formatNumber(row.amount, {
                          maximumFractionDigits: 8,
                          minimumFractionDigits: 3,
                        })}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: "monospace" }}>
                        {formatNumber(row.usd_value, {
                          maximumFractionDigits: 4,
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontFamily: "monospace",
                          maxWidth: 280,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={row.tx}
                      >
                        {row.tx}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={data.total}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={(_, nextPage) =>
                load(nextPage, rowsPerPage, sortBy, sortDirection)
              }
              onRowsPerPageChange={(event) => {
                const nextRowsPerPage = Number(event.target.value);
                load(0, nextRowsPerPage, sortBy, sortDirection);
              }}
              rowsPerPageOptions={[10, 25, 50]}
              disabled={isPending}
            />
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
