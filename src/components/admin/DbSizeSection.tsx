import { getDatabaseSize } from "@/lib/backend/api/internal/db-stats";
import {
  Box,
  Card,
  CardContent,
  Chip,
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

function sizeColor(bytes: number): "success" | "warning" | "error" {
  const mb = bytes / 1024 / 1024;
  if (mb < 1000) return "success";
  if (mb < 10_000) return "warning";
  return "error";
}

export default async function DbSizeSection() {
  const data = await getDatabaseSize();

  return (
    <Card sx={{ mt: 4 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Database Size
        </Typography>

        <Stack spacing={2}>
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Chip
                  label={data.totalSize}
                  color={sizeColor(data.totalBytes)}
                  size="small"
                />
                <Typography variant="body2" color="text.secondary">
                  Total database size
                </Typography>
              </Stack>
            </CardContent>
          </Card>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Table</TableCell>
                  <TableCell align="right">Size</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.tables.map((row) => (
                  <TableRow key={row.tableName}>
                    <TableCell>
                      <Box
                        component="span"
                        sx={{ fontFamily: "monospace", fontSize: "0.85em" }}
                      >
                        {row.tableName}
                      </Box>
                    </TableCell>
                    <TableCell align="right">{row.totalSize}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      </CardContent>
    </Card>
  );
}
