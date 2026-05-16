import { getFeesPaidByDay } from "@/lib/backend/actions/land-manager/log-actions";
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
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";

/** Splinterlands charges 10 % on every resource transfer — the recipient receives 90 %. */
const TRANSPORT_FEE = 0.1;

const fmt = (n: number) =>
  n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });

export default async function FeesPaidSection() {
  const rows = await getFeesPaidByDay(30);

  // Collect every resource symbol seen so we can render stable columns.
  const symbolSet = new Set<string>();
  for (const row of rows) {
    for (const sym of Object.keys(row.totals)) symbolSet.add(sym);
  }
  const symbols = [...symbolSet].sort();

  return (
    <Card sx={{ mt: 4 }}>
      <CardContent>
        <Tooltip
          title="Amounts shown are what was received after the 10 % Splinterlands resource-transfer fee."
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
            Fees Received (daily totals)
          </Typography>
        </Tooltip>

        {rows.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No fee payments recorded yet.
          </Typography>
        ) : (
          <Stack spacing={2}>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    {symbols.map((sym) => (
                      <TableCell key={sym} align="right">
                        {sym}
                      </TableCell>
                    ))}
                    <TableCell>Contributors</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.date}>
                      <TableCell sx={{ fontFamily: "monospace" }}>
                        {row.date}
                      </TableCell>
                      {symbols.map((sym) => {
                        const gross = row.totals[sym] ?? 0;
                        const received = gross * (1 - TRANSPORT_FEE);
                        return (
                          <TableCell
                            key={sym}
                            align="right"
                            sx={{
                              fontFamily: "monospace",
                              color:
                                received > 0 ? "text.primary" : "text.disabled",
                            }}
                          >
                            {received > 0 ? fmt(received) : "—"}
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
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
