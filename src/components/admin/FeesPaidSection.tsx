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
  Typography,
} from "@mui/material";

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
        <Typography variant="h6" gutterBottom>
          Fees Paid (daily totals)
        </Typography>

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
                        const amount = row.totals[sym] ?? 0;
                        return (
                          <TableCell
                            key={sym}
                            align="right"
                            sx={{
                              fontFamily: "monospace",
                              color:
                                amount > 0 ? "text.primary" : "text.disabled",
                            }}
                          >
                            {amount > 0 ? fmt(amount) : "—"}
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
